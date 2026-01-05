# Bun Shell

Bun Shellを使用すると、JavaScriptからシェルコマンドを実行できます

Bun Shellは、JavaScriptとTypeScriptでシェルスクリプトを楽しく書けるようにします。シームレスなJavaScript相互運用を備えた、クロスプラットフォームのbashライクなシェルです。

クイックスタート:

```ts
import { $ } from "bun";

const response = await fetch("https://example.com");

// Responseをstdinとして使用
await $`cat < ${response} | wc -c`; // 1256
```

---

## 機能

- **クロスプラットフォーム**: Windows、Linux、macOSで動作します。`rimraf`や`cross-env`の代わりに、追加の依存関係をインストールせずにBun Shellを使用できます。`ls`、`cd`、`rm`などの一般的なシェルコマンドはネイティブに実装されています。
- **使い慣れた構文**: Bun Shellはbashライクなシェルで、リダイレクト、パイプ、環境変数などをサポートしています。
- **Glob**: `**`、`*`、`{expansion}`などのGlobパターンがネイティブにサポートされています。
- **テンプレートリテラル**: テンプレートリテラルを使用してシェルコマンドを実行します。これにより、変数や式の補間が簡単になります。
- **安全性**: Bun Shellはデフォルトですべての文字列をエスケープし、シェルインジェクション攻撃を防ぎます。
- **JavaScript相互運用**: `Response`、`ArrayBuffer`、`Blob`、`Bun.file(path)`などのJavaScriptオブジェクトをstdin、stdout、stderrとして使用できます。
- **シェルスクリプト**: Bun Shellはシェルスクリプト(`.bun.sh`ファイル)の実行に使用できます。
- **カスタムインタープリター**: Bun ShellはZigで書かれており、レキサー、パーサー、インタープリターを含みます。Bun Shellは小さなプログラミング言語です。

---

## はじめに

最もシンプルなシェルコマンドは`echo`です。実行するには、`$`テンプレートリテラルタグを使用します:

```js
import { $ } from "bun";

await $`echo "Hello World!"`; // Hello World!
```

デフォルトでは、シェルコマンドはstdoutに出力します。出力を抑制するには、`.quiet()`を呼び出します:

```js
import { $ } from "bun";

await $`echo "Hello World!"`.quiet(); // 出力なし
```

コマンドの出力をテキストとして取得したい場合は、`.text()`を使用します:

```js
import { $ } from "bun";

// .text()は自動的に.quiet()を呼び出します
const welcome = await $`echo "Hello World!"`.text();

console.log(welcome); // Hello World!\n
```

デフォルトでは、`await`するとstdoutとstderrが`Buffer`として返されます。

```js
import { $ } from "bun";

const { stdout, stderr } = await $`echo "Hello!"`.quiet();

console.log(stdout); // Buffer(7) [ 72, 101, 108, 108, 111, 33, 10 ]
console.log(stderr); // Buffer(0) []
```

---

## エラーハンドリング

デフォルトでは、ゼロ以外の終了コードはエラーをスローします。この`ShellError`には実行されたコマンドに関する情報が含まれています。

```js
import { $ } from "bun";

try {
  const output = await $`something-that-may-fail`.text();
  console.log(output);
} catch (err) {
  console.log(`Failed with code ${err.exitCode}`);
  console.log(err.stdout.toString());
  console.log(err.stderr.toString());
}
```

`.nothrow()`を使用すると、スローを無効にできます。結果の`exitCode`を手動で確認する必要があります。

```js
import { $ } from "bun";

const { stdout, stderr, exitCode } = await $`something-that-may-fail`.nothrow().quiet();

if (exitCode !== 0) {
  console.log(`Non-zero exit code ${exitCode}`);
}

console.log(stdout);
console.log(stderr);
```

ゼロ以外の終了コードのデフォルト処理は、`$`関数自体で`.nothrow()`または`.throws(boolean)`を呼び出すことで設定できます。

```js
import { $ } from "bun";
// シェルプロミスはスローしなくなり、すべてのシェルコマンドで
// `exitCode`を手動で確認する必要があります
$.nothrow(); // $.throws(false)と同等

// デフォルトの動作、ゼロ以外の終了コードはエラーをスローします
$.throws(true);

// $.nothrow()のエイリアス
$.throws(false);

await $`something-that-may-fail`; // 例外はスローされません
```

---

## リダイレクト

コマンドの*入力*または*出力*は、典型的なBash演算子を使用して*リダイレクト*できます:

- `<` stdinをリダイレクト
- `>`または`1>` stdoutをリダイレクト
- `2>` stderrをリダイレクト
- `&>` stdoutとstderrの両方をリダイレクト
- `>>`または`1>>` stdoutをリダイレクト、上書きではなく宛先に*追加*
- `2>>` stderrをリダイレクト、上書きではなく宛先に*追加*
- `&>>` stdoutとstderrの両方をリダイレクト、上書きではなく宛先に*追加*
- `1>&2` stdoutをstderrにリダイレクト(stdoutへのすべての書き込みがstderrになります)
- `2>&1` stderrをstdoutにリダイレクト(stderrへのすべての書き込みがstdoutになります)

Bun ShellはJavaScriptオブジェクトとの間のリダイレクトもサポートしています。

### 例: JavaScriptオブジェクトへの出力のリダイレクト (`>`)

JavaScriptオブジェクトにstdoutをリダイレクトするには、`>`演算子を使用します:

```js
import { $ } from "bun";

const buffer = Buffer.alloc(100);
await $`echo "Hello World!" > ${buffer}`;

console.log(buffer.toString()); // Hello World!\n
```

リダイレクト先として以下のJavaScriptオブジェクトがサポートされています:

- `Buffer`、`Uint8Array`、`Uint16Array`、`Uint32Array`、`Int8Array`、`Int16Array`、`Int32Array`、`Float32Array`、`Float64Array`、`ArrayBuffer`、`SharedArrayBuffer` (基礎となるバッファに書き込み)
- `Bun.file(path)`、`Bun.file(fd)` (ファイルに書き込み)

### 例: JavaScriptオブジェクトからの入力のリダイレクト (`<`)

JavaScriptオブジェクトからstdinに出力をリダイレクトするには、`<`演算子を使用します:

```js
import { $ } from "bun";

const response = new Response("hello i am a response body");

const result = await $`cat < ${response}`.text();

console.log(result); // hello i am a response body
```

リダイレクト元として以下のJavaScriptオブジェクトがサポートされています:

- `Buffer`、`Uint8Array`、`Uint16Array`、`Uint32Array`、`Int8Array`、`Int16Array`、`Int32Array`、`Float32Array`、`Float64Array`、`ArrayBuffer`、`SharedArrayBuffer` (基礎となるバッファから読み取り)
- `Bun.file(path)`、`Bun.file(fd)` (ファイルから読み取り)
- `Response` (ボディから読み取り)

### 例: stdin -> ファイルへのリダイレクト

```js
import { $ } from "bun";

await $`cat < myfile.txt`;
```

### 例: stdout -> ファイルへのリダイレクト

```js
import { $ } from "bun";

await $`echo bun! > greeting.txt`;
```

### 例: stderr -> ファイルへのリダイレクト

```js
import { $ } from "bun";

await $`bun run index.ts 2> errors.txt`;
```

### 例: stderr -> stdoutへのリダイレクト

```js
import { $ } from "bun";

// stderrをstdoutにリダイレクトするので、すべての出力が
// stdoutで利用可能になります
await $`bun run ./index.ts 2>&1`;
```

### 例: stdout -> stderrへのリダイレクト

```js
import { $ } from "bun";

// stdoutをstderrにリダイレクトするので、すべての出力が
// stderrで利用可能になります
await $`bun run ./index.ts 1>&2`;
```

## パイプ (`|`)

bashと同様に、あるコマンドの出力を別のコマンドにパイプできます:

```js
import { $ } from "bun";

const result = await $`echo "Hello World!" | wc -w`.text();

console.log(result); // 2\n
```

JavaScriptオブジェクトでもパイプできます:

```js
import { $ } from "bun";

const response = new Response("hello i am a response body");

const result = await $`cat < ${response} | wc -w`.text();

console.log(result); // 6\n
```

## コマンド置換 (`$(...)`)

コマンド置換を使用すると、別のスクリプトの出力を現在のスクリプトに置換できます:

```js
import { $ } from "bun";

// 現在のコミットのハッシュを出力
await $`echo Hash of current commit: $(git rev-parse HEAD)`;
```

これはコマンドの出力のテキスト挿入であり、例えばシェル変数を宣言するために使用できます:

```js
import { $ } from "bun";

await $`
  REV=$(git rev-parse HEAD)
  docker built -t myapp:$REV
  echo Done building docker image "myapp:$REV"
`;
```

**注意**: Bunは内部的に入力テンプレートリテラルの特別な[`raw`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#raw_strings)プロパティを使用するため、コマンド置換にバッククォート構文を使用しても機能しません:

```ts
import { $ } from "bun";

await $`echo \`echo hi\``;
```

以下を出力する代わりに:

```
hi
```

上記は以下を出力します:

```
echo hi
```

代わりに`$(...)`構文を使用することをお勧めします。

---

## 環境変数

環境変数はbashと同様に設定できます:

```js
import { $ } from "bun";

await $`FOO=foo bun -e 'console.log(process.env.FOO)'`; // foo\n
```

文字列補間を使用して環境変数を設定できます:

```js
import { $ } from "bun";

const foo = "bar123";

await $`FOO=${foo + "456"} bun -e 'console.log(process.env.FOO)'`; // bar123456\n
```

入力はデフォルトでエスケープされ、シェルインジェクション攻撃を防ぎます:

```js
import { $ } from "bun";

const foo = "bar123; rm -rf /tmp";

await $`FOO=${foo} bun -e 'console.log(process.env.FOO)'`; // bar123; rm -rf /tmp\n
```

### 環境変数の変更

デフォルトでは、すべてのコマンドの環境変数として`process.env`が使用されます。

`.env()`を呼び出すことで、単一のコマンドの環境変数を変更できます:

```js
import { $ } from "bun";

await $`echo $FOO`.env({ ...process.env, FOO: "bar" }); // bar
```

`$.env`を呼び出すことで、すべてのコマンドのデフォルト環境変数を変更できます:

```js
import { $ } from "bun";

$.env({ FOO: "bar" });

// グローバルに設定された$FOO
await $`echo $FOO`; // bar

// ローカルに設定された$FOO
await $`echo $FOO`.env({ FOO: "baz" }); // baz
```

引数なしで`$.env()`を呼び出すことで、環境変数をデフォルトにリセットできます:

```js
import { $ } from "bun";

$.env({ FOO: "bar" });

// グローバルに設定された$FOO
await $`echo $FOO`; // bar

// ローカルに設定された$FOO
await $`echo $FOO`.env(undefined); // ""
```

### 作業ディレクトリの変更

`.cwd()`に文字列を渡すことで、コマンドの作業ディレクトリを変更できます:

```js
import { $ } from "bun";

await $`pwd`.cwd("/tmp"); // /tmp
```

`$.cwd`を呼び出すことで、すべてのコマンドのデフォルト作業ディレクトリを変更できます:

```js
import { $ } from "bun";

$.cwd("/tmp");

// グローバルに設定された作業ディレクトリ
await $`pwd`; // /tmp

// ローカルに設定された作業ディレクトリ
await $`pwd`.cwd("/"); // /
```

---

## 出力の読み取り

コマンドの出力を文字列として読み取るには、`.text()`を使用します:

```js
import { $ } from "bun";

const result = await $`echo "Hello World!"`.text();

console.log(result); // Hello World!\n
```

### JSONとして出力を読み取る

コマンドの出力をJSONとして読み取るには、`.json()`を使用します:

```js
import { $ } from "bun";

const result = await $`echo '{"foo": "bar"}'`.json();

console.log(result); // { foo: "bar" }
```

### 行ごとに出力を読み取る

コマンドの出力を行ごとに読み取るには、`.lines()`を使用します:

```js
import { $ } from "bun";

for await (let line of $`echo "Hello World!"`.lines()) {
  console.log(line); // Hello World!
}
```

完了したコマンドでも`.lines()`を使用できます:

```js
import { $ } from "bun";

const search = "bun";

for await (let line of $`cat list.txt | grep ${search}`.lines()) {
  console.log(line);
}
```

### Blobとして出力を読み取る

コマンドの出力をBlobとして読み取るには、`.blob()`を使用します:

```js
import { $ } from "bun";

const result = await $`echo "Hello World!"`.blob();

console.log(result); // Blob(13) { size: 13, type: "text/plain" }
```

---

## 組み込みコマンド

クロスプラットフォーム互換性のため、Bun ShellはPATH環境変数からコマンドを読み取ることに加えて、一連の組み込みコマンドを実装しています。

- `cd`: 作業ディレクトリを変更
- `ls`: ディレクトリ内のファイルをリスト
- `rm`: ファイルとディレクトリを削除
- `echo`: テキストを出力
- `pwd`: 作業ディレクトリを出力
- `bun`: bun内でbunを実行
- `cat`
- `touch`
- `mkdir`
- `which`
- `mv`
- `exit`
- `true`
- `false`
- `yes`
- `seq`
- `dirname`
- `basename`

**部分的に**実装:

- `mv`: ファイルとディレクトリを移動(クロスデバイスサポートが欠けています)

**未実装**ですが、計画中:

- 完全なリストについては[Issue #9716](https://github.com/oven-sh/bun/issues/9716)を参照してください。

---

## ユーティリティ

Bun Shellは、シェルを操作するための一連のユーティリティも実装しています。

### `$.braces` (ブレース展開)

この関数は、シェルコマンドのシンプルな[ブレース展開](https://www.gnu.org/software/bash/manual/html_node/Brace-Expansion.html)を実装します:

```js
import { $ } from "bun";

await $.braces(`echo {1,2,3}`);
// => ["echo 1", "echo 2", "echo 3"]
```

### `$.escape` (文字列のエスケープ)

Bun Shellのエスケープロジックを関数として公開します:

```js
import { $ } from "bun";

console.log($.escape('$(foo) `bar` "baz"'));
// => \$(foo) \`bar\` \"baz\"
```

文字列をエスケープしたくない場合は、`{ raw: 'str' }`オブジェクトでラップします:

```js
import { $ } from "bun";

await $`echo ${{ raw: '$(foo) `bar` "baz"' }}`;
// => bun: command not found: foo
// => bun: command not found: bar
// => baz
```

---

## `.sh`ファイルローダー

シンプルなシェルスクリプトの場合、`/bin/sh`の代わりにBun Shellを使用してシェルスクリプトを実行できます。

そのためには、`.sh`拡張子のファイルで`bun`を使用してスクリプトを実行するだけです。

```sh
echo "Hello World! pwd=$(pwd)"
```

```sh
bun ./script.sh
```

```txt
Hello World! pwd=/home/demo
```

Bun Shellを使用したスクリプトはクロスプラットフォームです。つまり、Windowsでも動作します:

```powershell
bun .\script.sh
```

```txt
Hello World! pwd=C:\Users\Demo
```

---

## 実装ノート

Bun ShellはBunの小さなプログラミング言語で、Zigで実装されています。手書きのレキサー、パーサー、インタープリターが含まれています。bash、zsh、その他のシェルとは異なり、Bun Shellは操作を並行して実行します。

---

## Bun Shellのセキュリティ

設計上、Bun Shellは*システムシェルを呼び出しません*(`/bin/sh`など)。代わりに、同じBunプロセスで実行されるbashの再実装であり、セキュリティを念頭に置いて設計されています。

コマンド引数を解析する際、すべての*補間された変数*を単一のリテラル文字列として扱います。

これにより、Bun Shellは**コマンドインジェクション**から保護されます:

```js
import { $ } from "bun";

const userInput = "my-file.txt; rm -rf /";

// 安全: `userInput`は単一の引用符付き文字列として扱われます
await $`ls ${userInput}`;
```

上記の例では、`userInput`は単一の文字列として扱われます。これにより、`ls`コマンドは「my-file; rm -rf /」という名前の単一のディレクトリの内容を読み取ろうとします。

### セキュリティ上の考慮事項

コマンドインジェクションはデフォルトで防止されますが、特定のシナリオではセキュリティに対する責任は開発者にあります。

`Bun.spawn`または`node:child_process.exec()` APIと同様に、引数を使用して新しいシェル(例: `bash -c`)を生成するコマンドを意図的に実行できます。

これを行うと、制御を引き渡すことになり、Bunの組み込み保護はその新しいシェルによって解釈される文字列には適用されなくなります。

```js
import { $ } from "bun";

const userInput = "world; touch /tmp/pwned";

// 安全でない: `bash -c`で新しいシェルプロセスを明示的に開始しました。
// この新しいシェルは`touch`コマンドを実行します。この方法で渡される
// ユーザー入力は厳密にサニタイズする必要があります。
await $`bash -c "echo ${userInput}"`;
```

### 引数インジェクション

Bun Shellは、外部コマンドが独自のコマンドライン引数をどのように解釈するかを知ることができません。攻撃者は、ターゲットプログラムが独自のオプションまたはフラグとして認識する入力を提供し、意図しない動作を引き起こす可能性があります。

```js
import { $ } from "bun";

// Gitコマンドラインフラグとしてフォーマットされた悪意のある入力
const branch = "--upload-pack=echo pwned";

// 安全でない: Bunは文字列を単一の引数として安全に渡しますが、
// `git`プログラム自体が悪意のあるフラグを認識して動作します。
await $`git ls-remote origin ${branch}`;
```

**推奨事項** — すべての言語でのベストプラクティスと同様に、外部コマンドに引数として渡す前に、常にユーザー提供の入力をサニタイズしてください。引数を検証する責任はアプリケーションコードにあります。

---

## クレジット

このAPIの大部分は、[zx](https://github.com/google/zx)、[dax](https://github.com/dsherret/dax)、[bnx](https://github.com/wobsoriano/bnx)に触発されました。これらのプロジェクトの作者に感謝します。
