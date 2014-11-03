# Image Histogram

Runs fine locally, but having problems on Heroku: 

https://image-histogram.herokuapp.com/

I am reusing my previous Node.js application as the backend REST API for computing the image histogram. 

https://image-histogram-api.herokuapp.com/

i.e.:

curl -X POST -d '{"imageUrl":"imageUrlGoesHere"}' -H "Content-Type: application/json" image-histogram-api.herokuapp.com/histogram 


# Persistence assignment

Create a site in Sinatra that saves information from a form to a database, then displays that information on the page. Examples:

* A single-user Twitter clone
* A blog that can be edited online
* A note-taking app
* A recipe site
* *etc.*

Using a SQL database is recommended, specifically PostgreSQL (a.k.a. "Postgres") via the [pg](https://bitbucket.org/ged/ruby-pg/wiki/Home) gem. The app doesn't need a lot of bells & whistles, e.g. user authentication, unless you get that first part done early.

**Deploy the application to Heroku**, and **submit a pull request** to this repository. Include:

* All the necessary files
* In the README:
    * Setup instructions
    * A link to the live app on Heroku
