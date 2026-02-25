export const AUTHORIZE_ZH = `
## 什么是 /authorize？

\`/authorize\` 命令用于将第三方服务（如 Google、GitHub 或 Microsoft）连接到您的 OpenClaw AI 助手。连接后，您的助手可以代您与这些服务进行交互。

---

## 工作原理

1. 在 Telegram 聊天中发送 \`/authorize\`
2. 从按钮中选择一个服务商（例如 Google）
3. 您的助手收到请求后，向您发送一个授权链接
4. 点击链接，登录该服务商并授予访问权限
5. Token 将下发到您的助手并保存在 \`OAUTH.md\` 中

之后，您的助手便可使用存储的 Token 访问已连接的服务。

---

## 可用服务商

以下服务商开箱即用（需平台完成配置）：

| 服务商 | 您的助手可以做什么 |
|---|---|
| **Google** | 访问 Google Drive、Gmail、Calendar 及其他 Google API |
| **GitHub** | 读写代码仓库、管理 Issue 和 Pull Request |
| **Microsoft** | 访问 OneDrive、Outlook 及 Microsoft 365 API |

如果某个服务商按钮未出现，说明该服务商尚未完成配置。

---

## 自定义 OAuth 应用

您的助手还可以使用您自己的应用凭据连接**任何 OAuth 服务商**。以下情况适合使用此功能：

- 希望使用自己的 OAuth 应用而非共享应用
- 需要连接上述列表之外的服务商（例如 Slack、GitLab、Bitbucket）
- 需要为特定用例申请特定的 OAuth 权限范围

### 如何设置自定义 OAuth 应用

1. **在服务商处注册 OAuth 应用**（例如 Google Cloud Console、GitHub 开发者设置）

2. **设置回调 URI** 为：
   \`\`\`
   https://router.xaiworkspace.com/oauth/callback
   \`\`\`

3. **告知您的助手**凭据信息，发送如下消息：
   > 为 GitHub 设置 OAuth，客户端 ID 为 \`your-client-id\`，客户端密钥为 \`your-client-secret\`

4. 您的助手将调用路由器生成 state token，构建授权 URL 并向您发送链接

5. 授权完成后，Token 将完成交换并保存至助手实例上的 \`OAUTH.md\`

### 底层工作机制

当您的助手发起自定义 OAuth 流程时，它会调用路由器的 \`/oauth/state\` 端点，传入您的自定义 \`clientId\`、\`clientSecret\` 和 \`tokenUrl\`。路由器会按客户端存储这些信息，并在 OAuth 服务商回调至回调 URL 时使用它们完成 Token 交换。

---

## 安全性

- **OAuth 应用密钥永不离开路由器** — 对于全局服务商，客户端密钥存储于 AWS Secrets Manager，从不发送至您的助手实例
- **自定义凭据按客户端存储**于数据库中，仅用于您的 Token 交换
- **State token 10 分钟后过期**，以防止重放攻击
- **Token 本地保存**在您助手实例的 \`OAUTH.md\` 中 — 不与其他用户共享

---

## 常见问题排查

| 问题 | 解决方法 |
|---|---|
| 未出现任何服务商按钮 | 平台尚未配置任何 OAuth 服务商 |
| 提示"您的助手必须处于运行状态" | 先发送 \`/start\` 唤醒您的实例 |
| 未收到授权链接 | 助手可能正忙，稍等片刻后重试 |
| 点击链接后提示"State 已过期" | 链接已过期（有效期 10 分钟），重新运行 \`/authorize\` |
| Token 交换失败 | 检查回调 URI 是否完全一致：\`https://router.xaiworkspace.com/oauth/callback\` |
`;
