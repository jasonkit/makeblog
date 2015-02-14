src  = ../src
dest = ../blog
template = ../templates

js_target = blog.js
js_main = main.js

watcher_pid = /tmp/makeblog-watcher.pid

-include ../makeblog.mk

post_targets = $(patsubst $(src)/posts/%.md,$(dest)/posts/%/index.html,$(wildcard $(src)/posts/*.md))
page_targets = $(patsubst $(src)/pages/%.md,$(dest)/pages/%/index.html,$(wildcard $(src)/pages/*.md))

css_sources = $(subst $(wildcard $(src)/css/_*.scss),,$(wildcard $(src)/css/*.scss))
css_targets = $(patsubst $(src)/css/%.scss,$(dest)/css/%.css,$(css_sources))

js_sources = $(shell find $(src)/js -path $(src)/js/node_modules -prune -o -name "*.js" -print)

template_sources = $(shell find $(template) -type f)

build: prepare_dir $(css_targets) $(page_targets) $(post_targets) $(dest)/$(js_target)
	@rsync -a --out-format="Copying $(src)/%n" --exclude=*.scss --exclude=*.md --exclude=js $(src)/* $(dest)

prepare_dir:
	@mkdir -p $(dest)/css
	@mkdir -p $(dest)/pages
	@mkdir -p $(dest)/posts

$(dest)/posts/%/index.html: $(src)/posts/%.md $(template_sources)
	@echo Building $@
	@node makeentry.js -t $(template) -i $< -o $@

$(dest)/pages/%/index.html: $(src)/pages/%.md $(template_sources)
	@echo Building $@
	@node makeentry.js -t $(template) -i $< -o $@

$(dest)/css/%.css: $(src)/css/%.scss $(wildcard $(src)/css/_*.scss)
	@echo Building $@
	@scss -E UTF-8 --no-cache --style compressed $< > $@

$(dest)/$(js_target): $(js_sources) 
	@echo Building $@
	@browserify -o $@ $(src)/js/$(js_main)

clean:
	@read -p "Are you sure wipe $(dest) [y]?" confirm; test "$$confirm" = "y" && rm -rf $(dest)/* || echo "Clean action cancelled."

watch:
	@test -e $(watcher_pid) && echo "watcher is running already." || fswatch-run-bash $(src) make > /dev/null 2>&1 & echo `expr $$! + 4` > $(watcher_pid); echo "Watching $(src)..."

unwatch:
	-@kill $(shell cat $(watcher_pid)) > /dev/null
	-@rm $(watcher_pid) > /dev/null
	@echo "Stop watching $(src)."
