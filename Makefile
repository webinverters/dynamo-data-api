# @Author: Robustly.io <m0ser>
# @Date:   2016-02-25T23:49:20-05:00
# @Email:  m0ser@robustly.io
# @Last modified by:   Auto
# @Last modified time: 2016-05-01T23:56:16-04:00
# @License: Apache-2.0
ISTANBUL=node_modules/.bin/istanbul
UNIT_TEST_FILES=$(shell find . -name "*.spec.js" -not -path "*/node_modules/*" -not -path "*/bower_components/*")
INT_TEST_FILES=$(shell find . -name "*.int.js" -not -path "*/node_modules/*")
API_TEST_FILES=$(shell find . -name "*.api.js" -not -path "*/node_modules/*")
MOCHA_ARGS=--bail -u bdd --timeout 120000
MOCHA=./node_modules/.bin/mocha ${MOCHA_ARGS}

env?="staging"
ssh_host=""  # TODO: setthis host to your ~/.ssh/config file.
type?=patch
repo=""  # TODO: set the name of your repo.  Ex.  org/repo.git

############# Tests ###############
unit:
	${MOCHA} -r test/unit/setup.js ${UNIT_TEST_FILES} ${ARGS}

int: start-services
	${MOCHA} ${INT_TEST_FILES} ${ARGS}

api:
	${MOCHA} -r test/api/setup.js ${API_TEST_FILES} ${ARGS}

e2e:
	protractor test/e2e/conf.js

all: unit int api

coverage:
	$(ISTANBUL) cover node_modules/.bin/_mocha -- ${MOCHA_ARGS} -r test/int-config.js ${ARGS} ${UNIT_TEST_FILES} ${INT_TEST_FILES}
	mv coverage/lcov-report _docs/lcov-report
	open _docs/lcov-report/index.html

# Developer Helpers
setup:
	echo "Installing module-base dependencies and setting up project for dev."
	npm install

setup-docs:
	echo "Installing the documentation framework and setting up gh-pages"
ifndef repo
	$(error repo is not set)
endif
	-rm -rf _docs
	git clone git@${ssh_host}:${repo} _docs
	cd _docs && git checkout --orphan gh-pages && git rm -rf . && echo "Enjoy robust/module-base by m0ser" > index.html && git add -A . && git commit -am "init" && git push origin gh-pages
	open _docs/index.html

docs:
	jsdoc -c jsdoc.json -R README.md
	open _docs/index.html

switch:
	cp ./conf/${env}.env .env

start-services:
	# -pg_ctl -D /usr/local/var/postgres -l /usr/local/var/postgres/server.log start
	# -fakes3 -r tmp/fakes3 -p 4568 &
	# -pkill -f DynamoDBLocal_lib
	# -java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb --port 4567 &

env-init:
	echo "Initializing the environment ${env}"
	node utils/init
	echo "Finished initializing."

env-destroy:
	node utils/destroy
	echo "Successfully cleaned environment.  Be sure to kill 'node index' and restart it."

publish:
	git commit -am "${msg}"
	gulp ${type}
	git push origin master --tags
	npm publish
	make publish-docs

publish-docs:
	make docs && cd _docs && git add -A . && git commit -am "documets update" && git push origin gh-pages
	open http://robustly.github.io/module-base/

.PHONY: unit int coverage viewCov all e2e user env-init env-destroy switch start-services api publish docs setup publish-docs setup-docs
