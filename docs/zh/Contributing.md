# 如何参与项目贡献？

本文件描述了参与项目贡献的方法。

## 如何报告错误或请求新功能？

你可以通过应用程序的菜单栏或托盘菜单来完成。应用程序将生成一个链接到新的GitHub问题的链接，其中包含关于你的操作系统的预填详细信息（你仍需描述问题，它不会自动为你发送错误报告）。你也可以通过项目的GitHub仓库来报告问题。

在创建GitHub问题时，请查看：

  - 是否有任何类似的问题（包括已关闭的）；如果是，请尝试在该问题下描述你的问题或要求重新打开它以引起我的注意；

  - 如果你的问题可以在Web版本中重现——修复Discord的bug目前不是这个项目的优先事项，并且可能会在网站更新时造成可能的破坏；

## 如何在应用开发中工作并创建拉取请求？

在处理WebCord的源代码时，我建议阅读有关[每个文件][Files.md]的文档以及它们在WebCord中的作用，以了解您应该将代码放置在现有文件的哪个位置。我也鼓励阅读以下部分的文档：

- [`Build.md`]，以了解更多关于当前WebCord的开发脚本语法，包括如何编译、测试和打包源文件。

- [`Flags.md`]，以了解更多关于当前构建标志的实现。

## 如何翻译WebCord？

目前，WebCord已将其翻译移至其[Weblate实例][weblate]。
它包括翻译项目的现状、说明和限制。你可以自由地以*旧方式*（通过做PR）翻译它，然而Weblate的更改可能会更早地被拉取，以避免在Weblate方面产生冲突。

## 其他贡献方式：

你还可以通过以下方式帮助维护本项目：
  - 参与/回答GitHub讨论，
  - 帮助我解决问题，
  - 更新/处理文档，
  - 查看WebCord的源代码或拉取请求并建议更改。

[`Build.md`]: Build.md
[`Flags.md`]: Flags.md
[weblate]: https://hosted.weblate.org/projects/spacingbat3-webcord
