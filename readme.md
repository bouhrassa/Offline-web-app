# Offline web-app
This is an offline web app proof of concept to test Service workers. Here are the features.
- Pages caching
- Offline http request that sync up when the user is back online

1. In "postData" page, open up the developer tools to check the logs and the responses.
2. Set the network to "Offline"
3. Submit a new post. The post is store in "IndexedDB"
4. Go back online to trigger and the post will be send automatically.  
   
