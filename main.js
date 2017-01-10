"use strict";

var jsonfile = require('jsonfile');
const path = require('path');

function migrateFile(postmanFile) {
    console.log(`Migrating: ${postmanFile}`);

    jsonfile.readFile(postmanFile, (err, postManProject) => {
        if (err !== null || postManProject === undefined) {
        console.error(`Filed to load file: ${postmanFile}`);
        console.error(err);

        return;
        } 

        var restedProject = {
            dirty: false,
            history: []
        };

        restedProject.saved = postManProject.requests.map((postmanRequest) => {
            var restedRequest = {
                name: postmanRequest.name,
                url: postmanRequest.url,
                method: postmanRequest.method,
                body: postmanRequest.data,
                headers: {}
            }

            postmanRequest.headers.split("\n").forEach((headerLine) => {
                if (headerLine.length == 0) {
                    //Empty
                    return;
                }

                var parts = headerLine.split(":");

                //We normalize all header names to lower case. Header names
                //are case insensitive in the HTTP spec.
                restedRequest.headers[parts[0].toLowerCase()] = parts[1];
            });

            restedRequest.contentType = restedRequest.headers["content-type"] || "";

            return restedRequest;
        });

        var restedFile = path.basename(postmanFile, ".json") + "-rested.json";

        jsonfile.writeFile(restedFile, restedProject, (err) => {
            if (err !== null) {
                console.error(`Filed to save: ${restedFile}`);
                console.error(err);

                return;
            } 

            console.log(`Successfully saved rested file: ${restedFile}.`);
        });
    });
}

process.argv.forEach((postmanFile, index) => {
    if (index < 2) {
        return;
    }


    migrateFile(postmanFile);
});