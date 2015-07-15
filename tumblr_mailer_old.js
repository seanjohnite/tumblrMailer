var fs = require('fs');

var csvFile = fs.readFileSync('friend_list.csv', 'utf8');
var emailTemp = fs.readFileSync('email_template.html', 'utf8');

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

var toReplace = ['firstName', 'numMonthsSinceContact'];

csvParse(csvFile).forEach(function (person) {
  var thisEmail = emailTemp;
  toReplace.forEach(function (replacement, index) {
    thisEmail = thisEmail.replace('{{ ' + replacement + ' }}', person[replacement]);
  })
  console.log(thisEmail);
});
