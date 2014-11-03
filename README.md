# Sinatra "Hello World" Example

1. Install locally

    ```bash
    # get the code
    git clone https://github.com/cuny-nytech/sinatra-example.git
    # go into the project folder
    cd sinatra-example
    # install the dependencies listed in the Gemfile
    bundle
    ```

1. Run locally

    ```bash
    # start Rack (which runs config.ru)
    bundle exec rackup
    # open the page
    open http://localhost:9292/hi
    ```

1. Install [Heroku Toolbelt](https://toolbelt.heroku.com/)
1. Deploy to Heroku

    ```bash
    # create the app on Heroku
    heroku create
    # send latest code to Heroku
    git push -u heroku master
    # get "Web URL" of Heroku app
    heroku apps:info
    # open the page, using hostname printed by previous command
    open http://SOMETHING.herokuapp.com/hi
    ```

See the example at http://cuny-sinatra-example.herokuapp.com/hi.
