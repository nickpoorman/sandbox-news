# Sandbox News

### A HN style site for the Syracuse Student Sandbox

Somone mentioned the other day at the sandbox meeting that we should have a place to communicate so I decided to write this up. Going to see if I can finish the entire thing in one weekend.

#### Rank Algorithm

Please note that I did not use the HN algorithm. It's my opinion that there is a better way to do it. This site works using lower bound of Wilson score confidence interval for a Bernoulli parameter.

...written on top of [node.js](http://nodejs.org/)

##### Mandatory production environment variables

* REDIS_PORT - redis port
* REDIS_URI - redis uri
* MONGO_PORT - mongoDB port
* MONGO_URI - mongoDB uri
* EMAIL_USER - email account to send emails from
* EMAIL_PASS - email password
* COOKIE_SECRET - cookie signing key

##### Configure email sender

Adjust modules/email.js to send emails from a given service Gmail, SendGrid, etc.
