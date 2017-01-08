// case "GetSubscriberCount":
//   var endpoint = "" // ENDPOINT GOES HERE
//   var body = ""
//   https.get(endpoint, (response) => {
//     response.on('data', (chunk) => { body += chunk })
//     response.on('end', () => {
//       var data = JSON.parse(body)
//       var subscriberCount = data.items[0].statistics.subscriberCount
//       context.succeed(
//         generateResponse(
//           buildSpeechletResponse(`Current subscriber count is ${subscriberCount}`, true),
//           {}
//         )
//       )
//     })
//   })
//   break;
//
// case "GetVideoViewCount":
//   var endpoint = "" // ENDPOINT GOES HERE
//   var body = ""
//   https.get(endpoint, (response) => {
//     response.on('data', (chunk) => { body += chunk })
//     response.on('end', () => {
//       var data = JSON.parse(body)
//       var viewCount = data.items[0].statistics.viewCount
//       context.succeed(
//         generateResponse(
//           buildSpeechletResponse(`Current view count is ${viewCount}`, true),
//           {}
//         )
//       )
//     })
//   })
//   break;
//
// case "GetVideoViewCountSinceDate":
//   console.log(event.request.intent.slots.SinceDate.value)
//   var endpoint = "" // ENDPOINT GOES HERE
//   var body = ""
//   https.get(endpoint, (response) => {
//     response.on('data', (chunk) => { body += chunk })
//     response.on('end', () => {
//       var data = JSON.parse(body)
//       var viewCount = data.items[0].statistics.viewCount
//       context.succeed(
//         generateResponse(
//           buildSpeechletResponse(`Current view count is ${viewCount}`, true),
//           {}
//         )
//       )
//     })
//   })
//   break;
