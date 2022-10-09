
class fcm {

    constructor() {
        if (process.env.FCM_ENABLE !== '1') {
            console.log('# fcm disable')
            return
        }

        if(!(this instanceof fcm)) {
            return new fcm()
        }

        this.fbAdmin = this.init()
    }


    init() {
        try {
            let fb = require("firebase-admin")
            const serviceAccount = require(process.env.FCM_ADMIN_SDK_PATH);
            console.log('# load fcm admin success')

            fb.initializeApp({
                credential: fb.credential.cert(serviceAccount),
                databaseURL: process.env.FCM_FIREBASE_URL
            })

            console.log('# initialize firebase admin')

            return fb;

        } catch (e) {
            throw e
        }
    }

    send(token, data) {
        return new Promise( (resolve, reject) => {

            if (!token || token.length < 1) {
                reject();
            }

            const msg = {
                notification : data,
                data: {
                    title : data.title,
                    body : data.body,
                    click_action : 'FLUTTER_NOTIFICATION_CLICK'
                },
                token: token,
            };

            console.log(msg);
            console.log(this.fbAdmin.messaging);

            const res = this.fbAdmin.messaging().send(msg);

            console.log("fcm #################### \n" + res);

            resolve(res);
        })
    }

    sendMulti(tokens, data) {
        return new Promise( (resolve, reject) => {
            if (!(tokens instanceof Array) || tokens.length < 1) {
                reject()
            }

            const msg = {
                notification : data,
                data: data,
                tokens: tokens,
            }

            const res = this.fbAdmin.messaging().sendMulticast(msg)

            console.log("multi fcm #################### \n" + res);
            resolve(res);
        })
    }

    test() {
        console.log("tstee");
        console.log(this.fbAdmin);
    }
}


module.exports = fcm