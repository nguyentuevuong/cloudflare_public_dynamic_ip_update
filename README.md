# cloudflare_public_dynamic_ip_update

## Hướng dẫn sử dụng:
  - Cài đặt và lấy token API của cloud flare theo hướng dẫn [tại đây](https://dash.cloudflare.com/profile/api-tokens).
    - Cần tối thiểu 2 quyền: **Zone\:Read**, **DNS\:Edit**
  - Sau khi lấy được token, sửa file `.token` với nội dung là token value đã lấy được.
  - Sau khi lưu token thì chạy lệnh: `docker compose up -d` để khởi động container và chạy tự động.
  - Trong trường hợp không muốn dùng container, có thể chạy trực tiếp trên hệ điều hành thông qua lệnh: `node ./index.js`
    - Chú ý là môi trường cần thiết là Node.js phiên bản mới nhất.
  ## Chú ý:
  - Chương trình sẽ update lại toàn bộ các dns record hiện có, nếu cần, vui lòng điều chỉnh script phù hợp với nhu cầu của bạn.


English version:

## Usage Guide:

* Install and obtain a Cloudflare API token following the instructions [here](https://dash.cloudflare.com/profile/api-tokens).
  * At minimum, you need 2 permissions: **Zone\:Read**, **DNS\:Edit**
* After obtaining the token, edit the `.token` file with the token value you got.
* Once the token is saved, run the command: `docker compose up -d` to start the container and run it automatically.
* If you don’t want to use a container, you can run it directly on the operating system using the command: `node ./index.js`
  * Note that the required environment is the latest version of Node.js.

## Note:
* The program will update all existing DNS records. If necessary, please adjust the script to suit your needs.
