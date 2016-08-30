<!--
@Author: Robustly.io <m0ser>
@Date:   2016-02-26T00:27:54-05:00
@Email:  m0ser@robustly.io
@Last modified by:   Auto
@Last modified time: 2016-03-10T20:49:18-05:00
@License: Apache-2.0
-->

Enjoy developing with this npm module starter-project that comes with all the tools to simplify developing both large and small projects. Opinionated yet fully standard and customizable.

[Report An Issue](https://github.com/robustly/module-base/issues)

## Examples

Here's some sample features and commands to execute them.  

- Install dependencies and setup the project for development.

  `make setup`

- Run all tests and view report.

  `make all`

- Publish this module to the npm registry (uses the package.json file).

  `make publish msg="Releasing a new feature please enjoy!"`

- View test coverage report.

  `make coverage`

- Generate and publish documentation to gitpages (hosted by github):

  `make publish-docs`

## Customize

After you fork this starter project, here's a list of todo items you'll want to complete for your project.

- Fix package.json (set name, repo, homepage)
- Put values in the makefile for "repo" and "ssh_host"
- Create the conf folder and add your credentials.  (Ex. prod.env)
- Replace instances of module-base with your project name.
- Set author and license.
- Edit jsdoc.json and change the config to reflect your project.
- Publish the documentation: `make publish msg="First Release"`

## Motivation

Professional developers rely on documentation and automating development processes to make the development experience as simple and well-documented as possible while maintaining maximum flexibility and power.  This module offers a complete solution out of the box.

## Installation

** *module-base* requires GNU Make and git to be installed on your system. **
    [Install Make OSX](https://www.topbug.net/blog/2013/04/14/install-and-use-gnu-command-line-tools-in-mac-os-x/)
    [Install Git](https://help.github.com/articles/set-up-git/)

1. Fork this project and rename it to your module.  
2. Create a ssh config for your github user (if you don't already have one) and use it in your ssh_url.  [Setup SSH Config](https://gist.github.com/jexchan/2351996)
3. At the end of step 2 you should have an ssh config which can be used to indicate the ssh_url to your repository...  Plug that url into the `make publish ssh_url=git@github-user:org/repo.git` command.  If make publish is successful, move to step 4, otherwise back to step 1.
4. Follow the steps in the "Customize" section

## API Reference

- Run all tests `make all`
- Run unit tests `make unit`
- Run int tests `make int` -- these tests do not require external services.  They run completely locally.
- Run api tests `make api` -- E2E tests which usually require initializing external environments before they will pass.  Note: you may want to ensure you
are running in the right environment via: `make switch env=dev` Where "dev" is
the environment name.
- Switch environment configs: `make switch env={{environment_name}}`.  For this to be successful you'll need a "/conf" folder in the root of the project and an
environment file.  Example: "/conf/dev.env".

- Publish a new version after merging a pull request.  `make publish`
- Generate documentation `make docs`

## Development And Testing

- Run `make setup` to install all developer dependencies and configure the project for a developer.
- Run `make all` to run all tests and view report.
- Run `make coverage` to see a test coverage report.
- You can set coverage thresholds and prevent publishing if targets are not met.  See more at: [Istanbul](https://github.com/gotwarlost/istanbul#getting-started)

### Publishing to the NPM Registry

If api tests are passing, `make publish` creates a release and tag in github,
as well as publishes the module to npmjs.  It also generates and publishes your documentation to github.

1. Setup your npmjs account.  

Create an account at: https://npmjs.com/

If you already have an account run `npm login` which will install your ~/.npmrc
credentials file so `npm publish` will work.

Use `npm publish` to publish the package.

Note that everything in the directory will be included unless it is ignored by a local .gitignore or .npmignore file as described in npm-developers.

Test: Go to https://npmjs.com/package/<package>. You should see the information for your new package.

2. Run `make publish msg="some commit message..."`

## Automatic Documentation with JSDoc3

- Initialize and setup the documentation framework which relies on gh-pages.

  `make setup-docs`

- Generate the documentation:

    `make docs`

- Modify the documentation template:

  [Docstrap](http://docstrap.github.io/docstrap/index.html)

- Improve documentation:

  [JSDoc Guide](http://usejsdoc.org/)

- Publish the documentation:

    `make publish-docs`

## Module Details:

- This project starts off with example tests using a service container framework called robust-ioc.  You can read more about IoC frameworks and there uses here: [IoC Concepts](http://stackoverflow.com/questions/3058/what-is-inversion-of-control)

- You can completely ignore using an ioc container and just change the tests and code to the style you prefer.  Everything should still work.

- If you are interested in knowing more about the module pattern and development style used here, you can get the details here: [Slam-Dunk Style](https://m0serblog.wordpress.com/2016/02/28/slam-dunk-module-pattern/)

## Contributors

**Please report any bugs or issues here: [Report An Issue](https://github.com/robustly/module-base/issues) and I will always help fix them.**

All you need to do is run `make setup repo=ssl_url` and you will be ready to start developing the module, running tests, etc...  (Sometimes you may also require a config file in the "conf" folder, which is just a non-managed folder that will contain private configuration information you wouldn't want the public to have access to.  How your team manages its private configuration data is up to you, but this module showcases a technology called "dotenv" with a "conf" folder to switch between environment configuration files.

## Future Improvements

- Remove gulp task dependency and utilize vanilla git commands to release and tag.
- Read the .git/config file to potentially save users from having to lookup their ssh_url to their repos.
- Add step by step instructions to setup a local ssh config for a repo.

## License

Apache-2
