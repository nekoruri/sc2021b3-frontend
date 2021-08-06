# B3 サンプルアプリ (Frontend)

基本的なログイン機能を備えたユーザー投稿型アプリケーションのサンプルです。


## 利用方法

あらかじめAuth0側の設定と、API側のデプロイまで終わらせておきます。

* public/js/app.js
  * 3行目の<code>let apiEndpoint = "https://dvhrde83ui.execute-api.ap-northeast-1.amazonaws.com/";</code>の部分を、
    API側デプロイ時に表示されたエンドポイントURLに変更
* public/auth_config.json
  * <code>"domain": "dev-9zllcerz.us.auth0.com",</code>の部分を、自分のAuth0ドメイン名に変更
  * <code>"clientId": "vA9A3aEbgevuRWbXwS0eBvpQtSNTLYxz",</code>の部分を、Auth0上で作成したApplicationのclientIdに変更
  * <code>audience</code>はそのままでも良いですが、変更する場合はAPI側のserverless.ymlとあわせる必要があります。


## Author

* [Auth0](auth0.com)
* NAKAYAMA Masahiro <aki@nekoruri.jp>

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.
