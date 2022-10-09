import axios from "axios";

const http = axios.create({
    baseURL: "https://api.iamport.kr",
});


// pg사 아임포트 클래스
class Import {

    constructor() {
        this.impKey = process.env.IMP_KEY;
        this.impSecrect = process.env.IMP_SECRET;
    }

    async getAccessToken() {

        try {
            let url = "/users/getToken";
            let data = {
                imp_key: this.impKey,
                imp_secret: this.impSecrect
            }

            const res = await http.post(url, data, {

                headers: {
                    "Content-Type": "application/json"
                }
            })

            const { access_token } = res.data.response; // 인증 토큰

            return access_token;
        }
        catch (e) {
            // console.log(e)
            return null;
        }
    }

    async getPaymentData(impUid) {

        let data;

        try {

            let url = '/payments/' + impUid
            let accTk = await this.getAccessToken();

            // console.log(accTk);

            const res = await http.get(url, {

                headers: {
                    "Authorization": accTk,
                    "Content-Type": "application/json"
                }
            })

            let resp = res.data.response;

            let item = {
                success: true,
                "imp_uid": impUid,
                "merchant_uid": resp.merchant_uid,
                "name": resp.name,
                "amount": resp.amount,
                "paid_at": resp.paid_at,
                "pay_method": resp.pay_method,
                "status": resp.status,
                "card_name": resp.card_name,
                "card_number": resp.card_number,
                // "goods_category" : resp.custom_data.goods_category
            }

            return item;
        }

        catch (e) {

            let item = { success: false, ...e.response.data }

            return item;
        }
    }

    async refund(orderInfo) {

        let data = {
            "imp_uid": orderInfo["imp_uid"],
            "merchant_uid": orderInfo["merchant_uid"],
            "amount": orderInfo["amount"], // 가맹점 클라이언트로부터 받은 환불금액
            "checksum": orderInfo["checksum"], // 환불 가능 금액
            "reason": orderInfo["reason"],
        }

        // console.log(data);

        let accTk = await this.getAccessToken();
        let url = "/payments/cancel";

        // console.log(accTk);

        try {

            const getCancelData = await http.post(url, data, {

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": accTk
                }
            });

            // console.log(getCancelData)

            const res = getCancelData.data;
            // console.log(res)

            if (!res.response) {

                return { success: false, ...res }
            }
            else {
                return { success: true, ...res }
            }
        }

        catch (e) {

            return { success: false, ...e.response.data }

            // console.log(e)
        }
    }

}

export default new Import()