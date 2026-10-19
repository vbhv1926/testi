import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const accountsToAdd = [
  {
    name: "ac11",
    handle: "@ac11",
    cookies: `[{"domain":".x.com","expirationDate":1814954303,"hostOnly":false,"httpOnly":false,"name":"__gpi","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"UID=0000144fb93847fb:T=1781258303:RT=1781258303:S=ALNI_MbGr2bo0rh-zV_TUThW5IROujDgbQ"},{"domain":".x.com","expirationDate":1812794301.409767,"hostOnly":false,"httpOnly":true,"name":"auth_token","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"9594b29ff166dfc0db01d2a395c7ec1843b71e19"},{"domain":".x.com","expirationDate":1781267258.304731,"hostOnly":false,"httpOnly":false,"name":"gt","path":"/","sameSite":null,"secure":true,"session":false,"storeId":null,"value":"2065372946260951479"},{"domain":".x.com","expirationDate":1815472522.275611,"hostOnly":false,"httpOnly":false,"name":"guest_id","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"v1%3A178125812215899227"},{"domain":".x.com","expirationDate":1812794303.111076,"hostOnly":false,"httpOnly":false,"name":"twid","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"u%3D131693307"},{"domain":".x.com","expirationDate":1814954303,"hostOnly":false,"httpOnly":false,"name":"__gads","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"ID=05fa30f99079a7b0:T=1781258303:RT=1781258303:S=ALNI_MaQhho3gqUlc50cHEj48igDYYRAiw"},{"domain":".x.com","expirationDate":1781863059.511306,"hostOnly":false,"httpOnly":false,"name":"external_referer","path":"/","sameSite":null,"secure":true,"session":false,"storeId":null,"value":"padhuUp37zjgzgv1mFWxJ12Ozwit7owX|0|8e8t2xd8A2w%3D"},{"domain":".x.com","expirationDate":1796810303,"hostOnly":false,"httpOnly":false,"name":"__eoi","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"ID=ae6cf5619ab5689b:T=1781258303:RT=1781258303:S=AA-AfjbeMzLgTIvXbAYiRupvd03T"},{"domain":".x.com","expirationDate":1781260058.711619,"hostOnly":false,"httpOnly":true,"name":"__cf_bm","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"UarZX.0S1I68.1envF5q0qQ4GwUUoiIuyik3SCjsX4M-1781258258.7202785-1.0.1.1-FMIzgQBIydGRb9goZcxPA4LcEyf2p51TFXGW_bQpXVteg72Yaq00I0NQLrR8NWWWwWiAJlXbHlzeMaS1rHaivkLpyBzgysZT_umE5IqpgTmjFMXFZVNX1aYy95ojtbpE"},{"domain":".x.com","expirationDate":1815818301.756305,"hostOnly":false,"httpOnly":false,"name":"ct0","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":null,"value":"270e59cc13588e6ee7f8171b823a951acc6ea8522b18745312eb16ee6b5d1147809df875b6d80880bae2fb3d9cdfe23f9315a14f67fa79409640aed87e23ef44b3b5dbf34f0a323a44d30c8b27c715e9"},{"domain":".x.com","expirationDate":1815818303.110958,"hostOnly":false,"httpOnly":false,"name":"guest_id_ads","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"v1%3A178125812215899227"},{"domain":".x.com","expirationDate":1815818303.111052,"hostOnly":false,"httpOnly":false,"name":"guest_id_marketing","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"v1%3A178125812215899227"},{"domain":".x.com","expirationDate":1815818258.304669,"hostOnly":false,"httpOnly":false,"name":"personalization_id","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"\\"v1_+GpALnGJQc0UaHtYl7tTwQ==\\""}]`
  },
  {
    name: "AC12",
    handle: "@AC12",
    cookies: `[{"domain":".x.com","expirationDate":1814954303,"hostOnly":false,"httpOnly":false,"name":"__gpi","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"UID=0000144fb93847fb:T=1781258303:RT=1781258995:S=ALNI_MbGr2bo0rh-zV_TUThW5IROujDgbQ"},{"domain":".x.com","expirationDate":1815818993.607692,"hostOnly":false,"httpOnly":true,"name":"auth_token","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"53fc0dfaf9bf6f53d0acfd53ee3f6d2ba3469221"},{"domain":".x.com","expirationDate":1781267258.304731,"hostOnly":false,"httpOnly":false,"name":"gt","path":"/","sameSite":null,"secure":true,"session":false,"storeId":null,"value":"2065372946260951479"},{"domain":".x.com","expirationDate":1815818993.948281,"hostOnly":false,"httpOnly":false,"name":"guest_id","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"v1%3A178125899379430415"},{"domain":".x.com","expirationDate":1815818993.607063,"hostOnly":false,"httpOnly":false,"name":"ads_prefs","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"\\"HBERAAA=\\""},{"domain":".x.com","expirationDate":1812794998.272683,"hostOnly":false,"httpOnly":false,"name":"twid","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"u%3D446925560"},{"domain":".x.com","expirationDate":1814954303,"hostOnly":false,"httpOnly":false,"name":"__gads","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"ID=05fa30f99079a7b0:T=1781258303:RT=1781258995:S=ALNI_MaQhho3gqUlc50cHEj48igDYYRAiw"},{"domain":".x.com","expirationDate":1815818995.12509,"hostOnly":false,"httpOnly":true,"name":"auth_multi","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":null,"value":"\\"1171321332371349504:e5fce36f899373728cef69bd8d57f96432d76ecb|131693307:9594b29ff166dfc0db01d2a395c7ec1843b71e19\\""},{"domain":".x.com","expirationDate":1796810303,"hostOnly":false,"httpOnly":false,"name":"__eoi","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"ID=ae6cf5619ab5689b:T=1781258303:RT=1781258995:S=AA-AfjbeMzLgTIvXbAYiRupvd03T"},{"domain":".x.com","expirationDate":1781260780.785236,"hostOnly":false,"httpOnly":true,"name":"__cf_bm","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"3MzQN0BaQiX8VVTqChMc6guBo0zhAiKMnZWw5Htl8iw-1781258980.7806354-1.0.1.1-jBScjXq9mEh0ADuywax2X3c1HIczUfSXt.zRLt9oJH6DZD82Ptg0Pmoj5szdlxgt.PZsuwjeJxelCl79yDJfVrOv_Vp4HsTy5mcperfMcC9jrYqwm04fF2hYCgk1ML97"},{"domain":".x.com","expirationDate":1815818993.948509,"hostOnly":false,"httpOnly":false,"name":"ct0","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":null,"value":"21a9658b5f32b2ce90e0b78b2db038cba73927f0bf375e2488e9203b84bb5cf3d265b12349a7470d6bcde857f303ca1175b5a84b56e232100b8ef2ee58d55206f2969e0de0954099e650e4172c9e83b6"},{"domain":".x.com","expirationDate":1815818998.272612,"hostOnly":false,"httpOnly":false,"name":"guest_id_ads","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"v1%3A178125899379430415"},{"domain":".x.com","expirationDate":1815818998.27266,"hostOnly":false,"httpOnly":false,"name":"guest_id_marketing","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"v1%3A178125899379430415"},{"domain":".x.com","expirationDate":1815818258.304669,"hostOnly":false,"httpOnly":false,"name":"personalization_id","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"\\"v1_+GpALnGJQc0UaHtYl7tTwQ==\\""}]`
  },
  {
    name: "ac13",
    handle: "@ac13",
    cookies: `[{"domain":".x.com","expirationDate":1814954303,"hostOnly":false,"httpOnly":false,"name":"__gpi","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"UID=0000144fb93847fb:T=1781258303:RT=1781258995:S=ALNI_MbGr2bo0rh-zV_TUThW5IROujDgbQ"},{"domain":".x.com","expirationDate":1815819041.429669,"hostOnly":false,"httpOnly":true,"name":"auth_token","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"e5fce36f899373728cef69bd8d57f96432d76ecb"},{"domain":".x.com","expirationDate":1781267258.304731,"hostOnly":false,"httpOnly":false,"name":"gt","path":"/","sameSite":null,"secure":true,"session":false,"storeId":null,"value":"2065372946260951479"},{"domain":".x.com","expirationDate":1815819041.766337,"hostOnly":false,"httpOnly":false,"name":"guest_id","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"v1%3A178125904161620882"},{"domain":".x.com","expirationDate":1815819041.42921,"hostOnly":false,"httpOnly":false,"name":"ads_prefs","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"\\"HBESAAA=\\""},{"domain":".x.com","expirationDate":1812795046.276256,"hostOnly":false,"httpOnly":false,"name":"twid","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"u%3D1171321332371349504"},{"domain":".x.com","expirationDate":1814954303,"hostOnly":false,"httpOnly":false,"name":"__gads","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"ID=05fa30f99079a7b0:T=1781258303:RT=1781258995:S=ALNI_MaQhho3gqUlc50cHEj48igDYYRAiw"},{"domain":".x.com","expirationDate":1815819042.855871,"hostOnly":false,"httpOnly":true,"name":"auth_multi","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":null,"value":"\\"446925560:53fc0dfaf9bf6f53d0acfd53ee3f6d2ba3469221|131693307:9594b29ff166dfc0db01d2a395c7ec1843b71e19\\""},{"domain":".x.com","expirationDate":1796810303,"hostOnly":false,"httpOnly":false,"name":"__eoi","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"ID=ae6cf5619ab5689b:T=1781258303:RT=1781258995:S=AA-AfjbeMzLgTIvXbAYiRupvd03T"},{"domain":".x.com","expirationDate":1781260780.785236,"hostOnly":false,"httpOnly":true,"name":"__cf_bm","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"3MzQN0BaQiX8VVTqChMc6guBo0zhAiKMnZWw5Htl8iw-1781258980.7806354-1.0.1.1-jBScjXq9mEh0ADuywax2X3c1HIczUfSXt.zRLt9oJH6DZD82Ptg0Pmoj5szdlxgt.PZsuwjeJxelCl79yDJfVrOv_Vp4HsTy5mcperfMcC9jrYqwm04fF2hYCgk1ML97"},{"domain":".x.com","expirationDate":1815819041.766471,"hostOnly":false,"httpOnly":false,"name":"ct0","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":null,"value":"0948636e140aaead34da8661c230e07068e70831c23f7db6dd37a520446ebd1031c6a567d1eeabcea5efae107f5f73c29946670fb2cb4f9aec2982c2acb6158a004c7b89dcc7008c07bdc7e54ee2380c"},{"domain":".x.com","expirationDate":1815819041.429144,"hostOnly":false,"httpOnly":false,"name":"dnt","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"1"},{"domain":".x.com","expirationDate":1815819046.276023,"hostOnly":false,"httpOnly":false,"name":"guest_id_ads","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"v1%3A178125904161620882"},{"domain":".x.com","expirationDate":1815819046.276144,"hostOnly":false,"httpOnly":false,"name":"guest_id_marketing","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"v1%3A178125904161620882"},{"domain":".x.com","expirationDate":1815818258.304669,"hostOnly":false,"httpOnly":false,"name":"personalization_id","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"\\"v1_+GpALnGJQc0UaHtYl7tTwQ==\\""}]`
  },
  {
    name: "ac14",
    handle: "@ac14",
    cookies: `[{"domain":".x.com","expirationDate":1814954303,"hostOnly":false,"httpOnly":false,"name":"__gpi","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"UID=0000144fb93847fb:T=1781258303:RT=1781258995:S=ALNI_MbGr2bo0rh-zV_TUThW5IROujDgbQ"},{"domain":".x.com","expirationDate":1812795127.703641,"hostOnly":false,"httpOnly":true,"name":"auth_token","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"5a13f185ffc5db44db0168b93fb78f8fb3147a97"},{"domain":".x.com","expirationDate":1781267258.304731,"hostOnly":false,"httpOnly":false,"name":"gt","path":"/","sameSite":null,"secure":true,"session":false,"storeId":null,"value":"2065372946260951479"},{"domain":".x.com","expirationDate":1815819041.766337,"hostOnly":false,"httpOnly":false,"name":"guest_id","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"v1%3A178125904161620882"},{"domain":".x.com","expirationDate":1815819041.42921,"hostOnly":false,"httpOnly":false,"name":"ads_prefs","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"\\"HBESAAA=\\""},{"domain":".x.com","expirationDate":1812795133.792077,"hostOnly":false,"httpOnly":false,"name":"twid","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"u%3D1623105193909911553"},{"domain":".x.com","expirationDate":1814954303,"hostOnly":false,"httpOnly":false,"name":"__gads","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"ID=05fa30f99079a7b0:T=1781258303:RT=1781258995:S=ALNI_MaQhho3gqUlc50cHEj48igDYYRAiw"},{"domain":".x.com","expirationDate":1815819129.341091,"hostOnly":false,"httpOnly":true,"name":"auth_multi","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":null,"value":"\\"131693307:9594b29ff166dfc0db01d2a395c7ec1843b71e19|446925560:53fc0dfaf9bf6f53d0acfd53ee3f6d2ba3469221|1171321332371349504:e5fce36f899373728cef69bd8d57f96432d76ecb\\""},{"domain":".x.com","expirationDate":1796810303,"hostOnly":false,"httpOnly":false,"name":"__eoi","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"ID=ae6cf5619ab5689b:T=1781258303:RT=1781258995:S=AA-AfjbeMzLgTIvXbAYiRupvd03T"},{"domain":".x.com","expirationDate":1781260780.785236,"hostOnly":false,"httpOnly":true,"name":"__cf_bm","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"3MzQN0BaQiX8VVTqChMc6guBo0zhAiKMnZWw5Htl8iw-1781258980.7806354-1.0.1.1-jBScjXq9mEh0ADuywax2X3c1HIczUfSXt.zRLt9oJH6DZD82Ptg0Pmoj5szdlxgt.PZsuwjeJxelCl79yDJfVrOv_Vp4HsTy5mcperfMcC9jrYqwm04fF2hYCgk1ML97"},{"domain":".x.com","expirationDate":1815819128.115254,"hostOnly":false,"httpOnly":false,"name":"ct0","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":null,"value":"ce123980c7fab7bd5f4f34b90a7b74bc506fc7e4cbd5cda47e1d7abd2f0ce759c93ced9477273e6fee7b701f6dea083cdaaf31b0bf2f9c9647c4dc5f4f5481160b31abfc12ef40f08e735ce161e48116"},{"domain":".x.com","expirationDate":1815819041.429144,"hostOnly":false,"httpOnly":false,"name":"dnt","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"1"},{"domain":".x.com","expirationDate":1815819133.791936,"hostOnly":false,"httpOnly":false,"name":"guest_id_ads","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"v1%3A178125904161620882"},{"domain":".x.com","expirationDate":1815819133.792029,"hostOnly":false,"httpOnly":false,"name":"guest_id_marketing","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"v1%3A178125904161620882"},{"domain":".x.com","expirationDate":1815818258.304669,"hostOnly":false,"httpOnly":false,"name":"personalization_id","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"\\"v1_+GpALnGJQc0UaHtYl7tTwQ==\\""}]`
  }
];

const rawProxies = `
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10000
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10001
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10002
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10003
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10004
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10005
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10006
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10007
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10008
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10009
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10010
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10011
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10012
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10013
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10014
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10015
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10016
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10017
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10018
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10019
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10020
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10021
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10022
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10023
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10024
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10025
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10026
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10027
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10028
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10029
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10030
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10031
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10032
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10033
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10034
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10035
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10036
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10037
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10038
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10039
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10040
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10041
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10042
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10043
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10044
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10045
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10046
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10047
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10048
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10049
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10050
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10051
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10052
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10053
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10054
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10055
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10056
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10057
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10058
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10059
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10060
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10061
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10062
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10063
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10064
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10065
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10066
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10067
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10068
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10069
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10070
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10071
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10072
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10073
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10074
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10075
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10076
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10077
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10078
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10079
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10080
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10081
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10082
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10083
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10084
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10085
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10086
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10087
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10088
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10089
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10090
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10091
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10092
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10093
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10094
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10095
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10096
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10097
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10098
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10099
`;
const proxyList = rawProxies.split('\n').map(p => p.trim()).filter(p => p);

async function main() {
  for (const account of accountsToAdd) {
    try {
      const assignedProxy = 'http://' + proxyList[Math.floor(Math.random() * proxyList.length)];
      await prisma.account.create({
        data: {
          name: account.name,
          handle: account.handle,
          cookies: account.cookies,
          status: 'Active',
          proxyIp: assignedProxy,
          region: ''
        }
      });
      console.log(`Added account: ${account.name} with proxy ${assignedProxy}`);
    } catch (e: any) {
      console.log(`Failed to add ${account.name}:`, e.message);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
