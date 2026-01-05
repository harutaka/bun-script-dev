# 基本方針

- 必ず日本語で応対してください。

## 概要

これはTypeScriptでシェルスクリプトを書くためのBun開発環境です。このプロジェクトはBunのShell APIを使用して、外部依存関係なしにWindows、Linux、macOSで動作するクロスプラットフォームのシェルスクリプトを作成します。

## コマンド

### スクリプトの実行
```bash
# サンプルスクリプトを実行
bun run sample

# 任意のTypeScriptファイルを直接実行
bun run src/filename.ts
```

### 開発
```bash
# 依存関係のインストール
bun install

# 型チェック（TypeScriptは設定済みだが明示的なチェックコマンドはない）
bun tsc --noEmit
```

## Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
