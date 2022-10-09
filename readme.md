### app local test
```
npm test
```

### babel build
```
npm run build
npm start
```



### admin account  
id : admin12  
pw : 1q2w3e!  


### err code

#### common
1000 : success  
1001 : empty data  
1002 : invalid data  
1003 : invalid account  
1004 : not found  
1005 : broken something  
1006 : parsing error  
1007 : invalid access  
1008 : token error  
1009 : sql error  
1010 : duplicate data  
1011 : upload error  
1012 : download error  
1013 : beyond something : 결과 값보다 많거나 초과.      
1014 : under something : 결과 값보다 작거나 미만.         
1015 : same user  
1016 : suspended user : 정지된 유저  
1017 : retire user : 탈퇴 유저          


#### order err
2001 : 주문 번호 생성 실패  
2002 : 주문 취소 불가   
2003 : pg사 데이터 조회 실패     
2004 : db 데이터 조회 실패  
2005 : 구매 실패  
2006 : 변조된 구매 데이터 대한 처리 오류     
2007 : 유효하지 않은 구매 데이터     



### .env 설정
```

# service port
# service port is int
PORT={port}

## host
host = "{address}"

# db
#DB_VENDOR="{mysql|postgresql}"
DB_HOST="{hostname}"
DB_NAME="{name}"
DB_USER="{user}"
DB_PASS="{password}"
DB_PORT="{port}"
DB_POOL="{pool}"

# log
# 1: info, 2: debug, 3: leveling, 5: fatal
LOG_LEVEL=5

# jwt
JWT_SECRET="{jwt}"
JWT_EXPIRE="{ex:24h}"

# 발급자 (optional)
JWT_ISSUER=""

# 토큰 제목
JWT_SUBJECT=""

# 파일 업로드 경로
UPLOAD_DIR="{upload directory}"
UPLOAD_VIDEO_DIR="{upload video directory}"

# setting fcm
FCM_ENABLE="{0:disable, 1:enable }"
FCM_ADMIN_SDK_PATH="firebase-adminsdk.json"
FCM_FIREBASE_URL="{fcm_url}" 

# aws chk
IS_AWS = {bool}

# aws_s3_key
AWS_ID = {access_id}
AWS_SECRET = {acess_scert}
AWS_BUCKET = {bucket_name}
AWS_S3_URL = {bucket_address}
AWS_HLS_URL = {cloudfront_hls_address}

```

# pm2 scripts
```
pm2 start npm -- start : npm 스크립 실행
pm2 monit : 모니터
pm2 list : 앱 리스트 보기 
pm2 delete [이름]
```
