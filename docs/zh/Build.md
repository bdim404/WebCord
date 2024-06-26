# 处理源代码

当处理WebCord时，你可能需要使用许多工具来能够将其从TypeScript编译成JavaScript，打包成可分发格式，运行linter等。本节将描述你可能需要知道的命令，以便继续其开发或自行从源代码打包。

<table class="alert-info">
<tr>
    <td> ℹ️ </td>
    <td>
        为了简化文档，下面只显示了<code>npm</code>命令语法。如果你更喜欢使用另一个包管理器，你完全可以这样做，因为在我的理念中，你不应该受到维护者使用的工具集的限制，并且有权选择你自己的工具。
    </td>
</tr>
</table>
<table class="alert-warn">
<tr>
    <td> ⚠️ </td>
    <td>
        WebCord带有<code>package-lock.json</code>作为锁文件格式，你偏好的包管理器可能无法与之配合使用。你仍然可以安装最新的依赖项，但是在依赖项破坏发生时，创建的锁文件将不会被用来重现测试环境。
    </td>
</tr>
</table>

## 安装应用程序依赖项。

这是你需要执行的第一个命令——没有它，你将无法继续进行应用程序测试和运行`package.json`中列出的大多数命令。
```sh
npm ci
```

这个命令使用`package-lock.json`，它包含了更快的包安装的解析包树。虽然`package-lock.json`包含了过去确认工作的依赖树，或者在发布的情况下也可以用于重现构建，你可能想要选择最新的*非破坏性*（根据`semver`规范）依赖项，这些依赖项可能包含错误修复和安全补丁。这通常不会引起任何破坏，如果出现任何问题，你仍然可以使用`git`回到以前的状态。

要更新依赖项到最新版本：

```
npm update
```

请注意，`npm ci`也会安装开发依赖项。**这** **可能是你想要的**，因为这些依赖项包括了编译、linting和打包WebCord所需的所有推荐包。然而，如果你只想安装生产依赖项（例如，你想使用你自己的工具集或已经使用`npm i -g`全局安装了它们），你可以使用以下命令：

```
npm i --only=prod
```

## 编译代码并直接运行应用程序（无需打包）。

在你安装了所有必需的`dependencies`和`devDependencies`之后，你可以使用以下命令逐步将WebCord的源代码从TypeScript编译成JavaScript：
```
npm run build
```

在打包之前编译代码并启动应用程序：
```
npm start
```

## 运行linter并验证代码。

在开发过程中，你可能想要检查你的代码质量是否足够被接受为WebCord项目的一部分。为此，你可能想要编译它（以确保没有编译错误）并运行linter（以检查其他问题）。为此，你可以使用下面的命令：
```
npm test
```

如果你不想编译代码，也可以只运行linter：
```
npm run lint
```

## 打包 / 创建可分发物。

如果你想与某人分享你打包的应用程序的二进制文件，或者只是想在没有源代码和开发包的情况下安装和/或使用它，你可以使用以下命令为你的平台生成所有有效的可分发文件：
```
npm run make
```

你也可以创建一个包含打包应用程序的目录。这个目录没有适应特定的分发格式，但它包含了带有编译应用程序的Electron二进制文件，如果你想要在你的操作系统中安装它，需要手动设置。要打包应用程序而不将其打包为可分发物，执行以下命令：
```
npm run package
```

这将为你当前的平台打包应用程序。

## 构建环境变量。

在使用`npm run make`制作应用程序可分发物时，你可以使用一些环境变量，这些变量将在应用程序打包之前生效。有关更多信息，请参见[`Flags.md`](./Flags.md#1-in-electron-forge)。
