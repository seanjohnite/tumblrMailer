var fs = require('fs');
var ejs = require('ejs');
var tumblr = require('tumblr.js');
var mandrill = require('mandrill-api/mandrill');

var csvFile = fs.readFileSync('friend_list.csv', 'utf8');
var emailTemp = fs.readFileSync('email_template.ejs', 'utf8');

//me things
var myName = "Sean Johnston";
var myEmail = "sean.johnst@gmail.com";
var keys = JSON.parse(fs.readFileSync('keys.json', 'utf8'));

var client = tumblr.createClient({
  consumer_key: keys.tumblr.consumer_key,
  consumer_secret: keys.tumblr.consumer_secret,
  token: keys.tumblr.token,
  token_secret: keys.tumblr.token_secret
});
var mandrillClient = new mandrill.Mandrill(keys.mandrill);

var csvParse = function parser(csvFile) {
  var lines = csvFile.split('\n');
  var headers = lines[0].split(',');
  var data = lines.slice(1);
  return data.map(function (string) {
    return string.split(',').reduce(function (mem, item, index) {
      mem[headers[index]] = item;
      return mem;
    }, {});
  });
};

var sendEmail = function sendEmail(to_name, to_email, from_name, from_email, subject, message_html) {
  var message = {
      "html": message_html,
      "subject": subject,
      "from_email": from_email,
      "from_name": from_name,
      "to": [{
              "email": to_email,
              "name": to_name
          }],
      "important": false,
      "track_opens": true,    
      "auto_html": false,
      "preserve_recipients": true,
      "merge": false,
      "tags": [
          "Fullstack_Tumblrmailer_Workshop"
      ]    
  };
  var async = false;
  var ip_pool = "Main Pool";
  mandrillClient.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
      // console.log(message);
      // console.log(result);   
  }, function(e) {
      // Mandrill returns the error as an object with name and message keys
      console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
      // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
  });
};

var getLatestPosts = function latest(blog) {
  var now = new Date();
  var sevenDays = 604800000;
  var latestPosts = [];
  for (var i = 0; i < blog.posts.length; i++) {
    var blogDate = new Date(blog.posts[i].date);
    if (now - blogDate < sevenDays) {
      latestPosts.push(blog.posts[i]);
    } else {
      break;
    }
  }
  return latestPosts;
};

var getTemplate = function templater(person, latestPosts) {
  return ejs.render(emailTemp, {
    firstName: person['firstName'],
    numMonthsSinceContact: person['numMonthsSinceContact'],
    latestPosts: latestPosts
  });
}

client.posts('seanjohnite.tumblr.com', function (err, blog) {
  if (err) {
    throw err;
  } else {
    var latestPosts = getLatestPosts(blog);



    csvParse(csvFile).forEach(function (person) {
      var customizedTemplate = getTemplate(person, latestPosts);
      var fullName = person.firstName + ' ' + person.lastName;
      var subject = 'Hey ' + person.firstName + '! Check out my new blog!';

      sendEmail(fullName, person.emailAddress, myName, myEmail, subject, customizedTemplate) 

    });
  }
});





