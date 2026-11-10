# Changelog

## [0.2.0](https://github.com/sovrin/veritas/compare/v0.1.0...v0.2.0) (2026-11-10)


### ⚠ BREAKING CHANGES

* the list of all projects with content and /api/content are gone; /api/content/<project>/* moved under /api/p/<project>/content; the status hook is gone (nexitas shows projectStatus).
* run as a module of nexitas, on its shared projects

### Features

* a very simple headless CMS, as a proof of concept ([14cecd2](https://github.com/sovrin/veritas/commit/14cecd2b5b346c823c1e03a0cc2f606726de98d5))
* **api:** ?fields= on a collection's list delivers only those fields ([4e13ab7](https://github.com/sovrin/veritas/commit/4e13ab7bb6337b1009b4b1cd885accd0a0445633))
* blog authoring: ?fields=, list fields, a Markdown editor, entries in a dialog ([e489a03](https://github.com/sovrin/veritas/commit/e489a03a9c1f100d70d8d15acaf56c92bac8d0a8))
* content is one page: collections as a switch, entries beside the list ([6ae6a55](https://github.com/sovrin/veritas/commit/6ae6a55893f38c7bc966566daa7d0bb4a1dad03a))
* **entries:** a toolbar and a preview for Markdown fields ([edf380e](https://github.com/sovrin/veritas/commit/edf380ea19bb3a1a03927970f19bbc8255ce036e))
* **entries:** a URL pasted over selected words links them ([26b439b](https://github.com/sovrin/veritas/commit/26b439b3a68c56d812f361ef73c2b0f9446d4aec))
* **entries:** an entry opens in a dialog over the list ([1a85196](https://github.com/sovrin/veritas/commit/1a85196e9aba1033a0b4fe4d4d0e599feaa525b2))
* **entries:** Publish and Unpublish in place of the Published switch ([260ae17](https://github.com/sovrin/veritas/commit/260ae173e45674b701a9a15e0e882d66eba95713))
* **fields:** image and file fields, from a module that provides files ([fd44dc4](https://github.com/sovrin/veritas/commit/fd44dc4378b94843fe9a2f26efca8624f9255f66))
* **fields:** list fields, for tags ([95b967c](https://github.com/sovrin/veritas/commit/95b967cb83fe5c610955ce03f23d4cd258c90cc8))
* one project's content, under its /p/&lt;id&gt; ([19aa513](https://github.com/sovrin/veritas/commit/19aa513f06c7cb9a490c36e8e17db16822bc6f0f))
* run as a module of nexitas, on its shared projects ([6431168](https://github.com/sovrin/veritas/commit/64311683346d2780d90f7f927fda7578a2a06904))
* **setup:** content is set up on its page, not the project's overview ([760fbed](https://github.com/sovrin/veritas/commit/760fbedfd75e551fb44dd071101a09c569105b0b))
* the console's look: a hue, a sidebar figure and the overview's story ([4c6d636](https://github.com/sovrin/veritas/commit/4c6d636d53cf57a2bf321df604f80c12972f8bd0))


### Bug Fixes

* build on the core's toolkit, in its UI patterns ([cae6ee9](https://github.com/sovrin/veritas/commit/cae6ee9a211efe8f565973a9bc0427ed6ee3c4f5))
* content pages render again ([58b00e0](https://github.com/sovrin/veritas/commit/58b00e0e7b769276774be025341e98fe015e4577))
* draw every page with the core's page kit ([d430611](https://github.com/sovrin/veritas/commit/d43061171cac61b2bb1dc985993210144234f556))
* **entries:** the Markdown preview toggle is an icon like the toolbar's others ([80b3724](https://github.com/sovrin/veritas/commit/80b3724deeabea431c56686ab8c2fa194a104dfa))
* filters lead together, and the switch's label matches the fields' ([3a1d3d0](https://github.com/sovrin/veritas/commit/3a1d3d01f9572516eb37a06700cefeb89fb21ebd))
* **security:** drop a removed field's values, list only published collections, limit /v1 ([f9fc69f](https://github.com/sovrin/veritas/commit/f9fc69fbfe8fc16fa8cdb3677b4925c6b4b56766))
