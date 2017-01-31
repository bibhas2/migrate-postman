"use strict";

var jsonfile = require('jsonfile');
const path = require('path');

function saveProject(postmanFile, restedProject) {
        var restedFile = path.basename(postmanFile, ".json") + "-rested.json";

        jsonfile.writeFile(restedFile, restedProject, (err) => {
            if (err !== null) {
                console.error(`Filed to save: ${restedFile}`);
                console.error(err);

                return;
            } 

            console.log(`Successfully saved rested file: ${restedFile}.`);
        });
}

function migrateFile(postmanFile, environmentFile) {
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

        //Load the environment file if provided
        if (environmentFile !== undefined) {
            console.log("Loading environment file: %s", environmentFile)

            jsonfile.readFile(environmentFile, (err, postManEnv) => {
                if (err !== null || postManEnv === undefined) {
                    console.error(`Filed to load environment file: ${environmentFile}`);
                    console.error(err);

                    return;
                }

                restedProject.environmentVariables = postManEnv.values.map((envVar) => {
                    return {
                        name: envVar.key,
                        value: envVar.value
                    }
                })
                
                saveProject(postmanFile, restedProject)
            })
        } else {
            saveProject(postmanFile, restedProject)
        }
    });
}

if (process.argv.length == 3) {
    migrateFile(process.argv[2]);
} else if (process.argv.length == 4) {
    migrateFile(process.argv[2], process.argv[3]);
} else {
    console.log("Usage: node . postman_project_file [postman_environment_file]")
}