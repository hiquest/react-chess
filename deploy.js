const s3 = require("s3");
 
const client = s3.createClient({ s3Options: require("./creds.json") });

var params = {
  localDir: "./build",
  deleteRemoved: true,
  s3Params: {
    Bucket: "chess.mdnbar.com"
  },
};

client
  .uploadDir(params)
  .on('error', function(err) {
    console.error("unable to sync:", err.stack);
  })
  .on('end', function() {
    console.log("done uploading");
  });
