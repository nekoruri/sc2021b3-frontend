// The Auth0 client, initialized in configureClient()
let auth0 = null;
let apiEndpoint = "https://dvhrde83ui.execute-api.ap-northeast-1.amazonaws.com/";

/**
 * Starts the authentication flow
 */
const login = async (targetUrl) => {
  try {
    console.log("Logging in", targetUrl);

    const options = {
      redirect_uri: window.location.origin
    };

    if (targetUrl) {
      options.appState = { targetUrl };
    }

    await auth0.loginWithRedirect(options);
  } catch (err) {
    console.log("Log in failed", err);
  }
};

/**
 * Executes the logout flow
 */
const logout = () => {
  try {
    console.log("Logging out");
    auth0.logout({
      returnTo: window.location.origin
    });
  } catch (err) {
    console.log("Log out failed", err);
  }
};

/**
 * Retrieves the auth configuration from the server
 */
const fetchAuthConfig = () => fetch("/auth_config.json");

/**
 * Initializes the Auth0 client
 */
const configureClient = async () => {
  const response = await fetchAuthConfig();
  const config = await response.json();

  auth0 = await createAuth0Client({
    domain: config.domain,
    client_id: config.clientId,
    audience: config.audience
  });
};

/**
 * Checks to see if the user is authenticated. If so, `fn` is executed. Otherwise, the user
 * is prompted to log in
 * @param {*} fn The function to execute if the user is logged in
 */
const requireAuth = async (fn, targetUrl) => {
  const isAuthenticated = await auth0.isAuthenticated();

  if (isAuthenticated) {
    return fn();
  }

  return login(targetUrl);
};

// ここまではAuth0のデモアプリのまま

/**
 * ログイン中ユーザの投稿一覧を表示
 */
const callApi = async () => {
  try {
    const token = await auth0.getTokenSilently();

    const response = await fetch(apiEndpoint, {
      headers: {Authorization: `Bearer ${token}`}
    });

    const responseData = await response.json();
    const posts = responseData.posts;

    const templateRow = document.querySelector('#post-template-row');
    const resultTbody = document.querySelector('#posts tbody');

    while (resultTbody.firstChild) {
      resultTbody.removeChild(resultTbody.firstChild);
    }

    if (posts.length === 0) {
      // 投稿が見つからない
      eachElement("#posts", (c) => c.classList.add("hidden"));
      eachElement("#result-alert", (c) => c.classList.remove("hidden"));
      document.querySelector('#result-alert').textContent = "投稿が見つかりません。";
      return;
    }

    posts.forEach((post) => {
      const newRow = templateRow.cloneNode(true);
      newRow.querySelector('.post-username').textContent = post.username;
      newRow.querySelector('.post-date').textContent = new Date(post.created_at * 1000).toLocaleString('ja-jp');
      newRow.querySelector('.post-body .text').textContent = post.body;
      if (post.imageUrl) {
        newRow.querySelector('.post-body').querySelector('a').setAttribute('href', post.imageUrl);
        newRow.querySelector('.post-body').querySelector('img').setAttribute('src', post.imageUrl);
      } else {
        newRow.querySelector('.post-body').removeChild(newRow.querySelector('.post-body').firstChild);
      }
      resultTbody.appendChild(newRow);
    });

    eachElement("#result-alert", (c) => c.classList.add("hidden"));
    eachElement("#posts", (c) => c.classList.remove("hidden"));
  } catch (e) {
    console.error(e);
  }
};

/**
 * 指定したユーザの投稿一覧を表示
 */
const callApiWithUser = async () => {
  try {
    const token = await auth0.getTokenSilently();

    const username = document.querySelector('#username').value;
    if (!username) {
      return;
    }

    const url = apiEndpoint + '?user=' + username;
    const response = await fetch(url, {
      headers: {Authorization: `Bearer ${token}`}
    });

    const responseData = await response.json();
    const posts = responseData.posts;

    const templateRow = document.querySelector('#post-template-row');
    const resultTbody = document.querySelector('#user-posts tbody');

    while (resultTbody.firstChild) {
      resultTbody.removeChild(resultTbody.firstChild);
    }

    if (posts.length === 0) {
      // 投稿が見つからない
      eachElement("#user-posts", (c) => c.classList.add("hidden"));
      document.querySelector('#user-result-alert').textContent = "投稿が見つかりません。";
      eachElement("#user-result-alert", (c) => c.classList.remove("hidden"));
      return;
    }

    posts.forEach((post) => {
      const newRow = templateRow.cloneNode(true);
      newRow.querySelector('.post-username').textContent = post.username;
      newRow.querySelector('.post-date').textContent = new Date(post.created_at * 1000).toLocaleString('ja-jp');
      newRow.querySelector('.post-body .text').textContent = post.body;
      if (post.imageUrl) {
        newRow.querySelector('.post-body').querySelector('a').setAttribute('href', post.imageUrl);
        newRow.querySelector('.post-body').querySelector('img').setAttribute('src', post.imageUrl);
      } else {
        newRow.querySelector('.post-body').removeChild(newRow.querySelector('.post-body').querySelector('a'));
      }
      resultTbody.appendChild(newRow);
    });

    eachElement("#user-result-alert", (c) => c.classList.add("hidden"));
    eachElement("#user-posts", (c) => c.classList.remove("hidden"));
  } catch (e) {
    console.error(e);
  }
};

const callPostApi = async () => {
  try {
    const token = await auth0.getTokenSilently();

    const body = document.querySelector('#body').value;

    const formData = new FormData();
    formData.append('body', body);
    formData.append('image', document.querySelector('#image').files[0]);
    const options = {
      method: 'post',
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      }
    };
    // delete options.headers['Content-Type'];
    const response = await fetch(apiEndpoint, options);

    document.querySelector('#body').value = ''; // フォームをクリア
    await callApi(); // 自分の投稿を再取得
  } catch (e) {
    console.error(e);
  }
};

// Will run when page finishes loading
window.onload = async () => {
  await configureClient();

  // If unable to parse the history hash, default to the root URL
  if (!showContentFromUrl(window.location.pathname)) {
    showContentFromUrl("/");
    window.history.replaceState({ url: "/" }, {}, "/");
  }

  const bodyElement = document.getElementsByTagName("body")[0];

  // Listen out for clicks on any hyperlink that navigates to a #/ URL
  bodyElement.addEventListener("click", (e) => {
    if (isRouteLink(e.target)) {
      const url = e.target.getAttribute("href");

      if (showContentFromUrl(url)) {
        e.preventDefault();
        window.history.pushState({ url }, {}, url);
      }
    } else if (e.target.getAttribute("id") === "call-api") {
      e.preventDefault();
      callApi();
    } else if (e.target.getAttribute("id") === "call-user-api") {
      e.preventDefault();
      callApiWithUser();
    } else if (e.target.getAttribute("id") === "call-post-api") {
      e.preventDefault();
      callPostApi();
    }
  });

  bodyElement.addEventListener("submit", (e) => {
    if (e.target.getAttribute("id") === "postForm") {
      e.preventDefault();
      callPostApi();
    } else if (e.target.getAttribute("id") === "getForm") {
      e.preventDefault();
      callApiWithUser();
    }
  });

  const isAuthenticated = await auth0.isAuthenticated();

  if (isAuthenticated) {
    console.log("> User is authenticated");
    window.history.replaceState({}, document.title, window.location.pathname);
    updateUI();
    return;
  }

  console.log("> User not authenticated");

  const query = window.location.search;
  const shouldParseResult = query.includes("code=") && query.includes("state=");

  if (shouldParseResult) {
    console.log("> Parsing redirect");
    try {
      const result = await auth0.handleRedirectCallback();

      if (result.appState && result.appState.targetUrl) {
        showContentFromUrl(result.appState.targetUrl);
      }

      console.log("Logged in!");
    } catch (err) {
      console.log("Error parsing redirect:", err);
    }

    window.history.replaceState({}, document.title, "/");
  }

  updateUI();
};
