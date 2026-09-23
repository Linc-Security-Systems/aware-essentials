# Publishing Changes
Libraries in this repo maintain an exactly similar version at all times. After doing a change to any of them, the versions must be bumped up to all of them including their dependencies on each other, yarn.lock regenerated accordingly and then you can push the changes.
Yarn is the tool used here and it's a workspace where there is a package.json in the root folder for all the projects.
Don't manually publish anything to npm, upon committing, there are github actions that will do that and the human repo owner (me) will receive an email upon publishing succeeds.
Before committing anyway, always ask for permission
