const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

var fireStore = admin.firestore()
var userRef = fireStore.collection('users');
var matchingRef = fireStore.collection('matching');

/*
  動作確認用のfunction
  httpリクエストを受け，下記のドキュメントを'matching'コレクションに書き込む
  「ユーザtest1がユーザtest2とユーザtes3をlikeした」
*/
exports.swipeLikeTest = functions.https.onRequest((req, res) => {
  matchingRef.doc('test1').set({
    'likedList': [
      {'id': 'test2', 'likedAt': 1},
      {'id': 'test3', 'likedAt': 2}
    ]
  })
  res.send("User 'test1' liked user 'test2' and 'test3' !")
})

/*
  'matching'コレクションの任意のドキュメントの作成で発火するfunction
  likeされたUserIdのLikedListの中にlikeをしたUserIdがあるかを調べる
*/
exports.findMatchOnCreate = functions.firestore
  .document('matching/{userId}')
  .onCreate((snap, context) => {
    var newDoc = snap.data();
    var newUserId = context.params.userId;
    var newLikedList = newDoc.likedList;

    for (let like of newLikedList) {
      let likedUserId = like.id;
      matchingRef.doc(`${likedUserId}`).get().then(doc => {
        if (!doc.exists) {
          console.log(`No likedList found: ${likedUserId}`)
        } else {
          var likedUsersLikedList = doc.data().likedList
          console.log(likedUsersLikedList)
          let match = likedUsersLikedList.some((v) => v.id == newUserId)
          if (match) {
            console.log(`Match found: ${newUserId} - ${likedUserId}!!`);
            // TODO: APNにPUSH
          } else {
            console.log(`User ${likedUserId} does not like user ${newUserId}.`);
          }
        }
      });
    }
});

/*
  'matching'コレクションの任意のドキュメントの更新で発火するfunction
  likeされたUserIdのLikedListの中にlikeをしたUserIdがあるかを調べる
*/
exports.findMatchOnUpdate = functions.firestore
  .document('matching/{userId}')
  .onUpdate((change, context) => {
    var newDoc = change.after.data();
    var newUserId = context.params.userId;
    var newLikedList = newDoc.likedList;

    for (let like of newLikedList) {
      let likedUserId = like.id;
      matchingRef.doc(`${likedUserId}`).get().then(doc => {
        if (!doc.exists) {
          console.log(`No likedList found: ${likedUserId}`)
        } else {
          var likedUsersLikedList = doc.data().likedList
          console.log(likedUsersLikedList)
          let match = likedUsersLikedList.some((v) => v.id == newUserId)
          if (match) {
            console.log(`Match found: ${newUserId} - ${likedUserId}!!`);
            // TODO: APNにPUSH
          } else {
            console.log(`User ${likedUserId} does not like user ${newUserId}.`);
          }
        }
      });
    }
});

/*
  cronもかけるらしいのでメモ
  firestoreにはttlの概念がないらしい
  一定時間でlikedAtを現在時刻と比較してDELETEを走らせるみたないバッチ作る必要ある
*/
// exports.cron = functions.pubsub.schedule('every 1 minutes') //('* * * * *') cron風にも書ける
//     .timeZone('Asia/Tokyo')
//     .onRun((context) => {
//         console.log("hello");
//         console.log(context);
//         return 0; //Function returned undefined, expected Promise or value 防止
//     });
