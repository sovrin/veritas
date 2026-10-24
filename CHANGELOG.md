# Changelog

## [0.2.0](https://github.com/sovrin/veritas/compare/v0.1.0...v0.2.0) (2026-10-24)


### ⚠ BREAKING CHANGES

* the list of all projects with content and /api/content are gone; /api/content/<project>/* moved under /api/p/<project>/content; the status hook is gone (nexitas shows projectStatus).
* run as a module of nexitas, on its shared projects

### Features

* a very simple headless CMS, as a proof of concept ([14cecd2](https://github.com/sovrin/veritas/commit/14cecd2b5b346c823c1e03a0cc2f606726de98d5))
* content is one page: collections as a switch, entries beside the list ([6ae6a55](https://github.com/sovrin/veritas/commit/6ae6a55893f38c7bc966566daa7d0bb4a1dad03a))
* one project's content, under its /p/&lt;id&gt; ([19aa513](https://github.com/sovrin/veritas/commit/19aa513f06c7cb9a490c36e8e17db16822bc6f0f))
* run as a module of nexitas, on its shared projects ([6431168](https://github.com/sovrin/veritas/commit/64311683346d2780d90f7f927fda7578a2a06904))
* the console's look: a hue, a sidebar figure and the overview's story ([4c6d636](https://github.com/sovrin/veritas/commit/4c6d636d53cf57a2bf321df604f80c12972f8bd0))


### Bug Fixes

* build on the core's toolkit, in its UI patterns ([cae6ee9](https://github.com/sovrin/veritas/commit/cae6ee9a211efe8f565973a9bc0427ed6ee3c4f5))
* draw every page with the core's page kit ([d430611](https://github.com/sovrin/veritas/commit/d43061171cac61b2bb1dc985993210144234f556))
* filters lead together, and the switch's label matches the fields' ([3a1d3d0](https://github.com/sovrin/veritas/commit/3a1d3d01f9572516eb37a06700cefeb89fb21ebd))
* **security:** drop a removed field's values, list only published collections, limit /v1 ([f9fc69f](https://github.com/sovrin/veritas/commit/f9fc69fbfe8fc16fa8cdb3677b4925c6b4b56766))
