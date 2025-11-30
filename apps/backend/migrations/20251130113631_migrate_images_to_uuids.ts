import type { Knex } from "knex";

interface ImageMapping {
  filename: string;
  uuid: string;
  phash: string;
  type: "team" | "organization";
  duplicate: boolean;
}

// Embedded image mappings from production image service
// Generated from image-mappings.json - contains 791 mappings
const EMBEDDED_MAPPINGS: ImageMapping[] = [
  {
    filename: "S10_1177.png",
    uuid: "84276c70-0180-42bc-8683-90d82d77b471",
    phash: "ee84913b6ec4913b",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1181.png",
    uuid: "44b8a909-7890-45fe-8975-6d4e1b587d05",
    phash: "bb6ac4953b6a8495",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1186.png",
    uuid: "74bf2022-b366-40ce-9853-6228cbeaaecd",
    phash: "be97c1683e878178",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1188.png",
    uuid: "b81e6e0d-4b69-49e8-971c-6e104c471210",
    phash: "ae27d1d03e27c1d8",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1191.png",
    uuid: "acdfcef4-ca03-4cd9-a7ec-518c0c5ac19c",
    phash: "e4349bdb34644ab6",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1192.png",
    uuid: "0505a57d-c0cd-4bff-a4b2-816acc209b7e",
    phash: "a4659e9ad13bc6c4",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1195.png",
    uuid: "42b55ec2-1b9e-48b0-adba-df6185a322a6",
    phash: "93dc64e73032c3cd",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1199.png",
    uuid: "a2a9a0f1-33f8-4e05-bdf8-ef66ad6ed619",
    phash: "e09f1f60e09f1f60",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1203.png",
    uuid: "69283481-00d5-407a-8e83-e35f49182a23",
    phash: "bcbe6171f204c768",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1210.png",
    uuid: "bdf51120-11a4-446a-ac0b-c13b030c09a5",
    phash: "af26d0d12f2ed0d1",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1212.png",
    uuid: "8bc316de-af21-4a21-b98d-750be368a9c5",
    phash: "e3b0ce4b916c2b93",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1219.png",
    uuid: "8313a0e8-f2d8-4ada-9cf1-0da00d7a8acf",
    phash: "afcaf09297258f24",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1220.png",
    uuid: "321817ab-65a1-4bc2-8c6f-596c371ca73c",
    phash: "ef3a90c52f3ad0c4",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1221.png",
    uuid: "8bccac2b-2e9c-4fbf-a772-de4978c64bc6",
    phash: "bf66c0993f6680d1",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1223.png",
    uuid: "0661a455-3b03-4cd0-8c75-37ee91b7d563",
    phash: "d4b72b48c635c393",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1224.png",
    uuid: "6e3c1e64-2acd-46d2-bc08-e98f1c37afad",
    phash: "bbb1c44e3ab1b10e",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1225.png",
    uuid: "3c46e3ed-2554-41f1-adcb-9bb4c4320f25",
    phash: "eb82941ecb699c36",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1230.png",
    uuid: "fb7fbca2-148f-4af6-94cd-67c758d5c916",
    phash: "a1e5de83d5588974",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1232.png",
    uuid: "28c0a1d8-e86b-4014-96ba-d6335866a9e5",
    phash: "cba0945f4ba0b45f",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1234.png",
    uuid: "22ca7774-c340-439b-b698-67be94c9a4fe",
    phash: "838f18b04fc6731f",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1237.png",
    uuid: "d9b314cb-38b7-4757-ae5b-45ceb0f1e96d",
    phash: "bbb1c44e4e04b9b3",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1238.png",
    uuid: "b220c8b4-b713-4d6f-b7ce-98d18bc8c77f",
    phash: "ed8882475ea9a976",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1240.png",
    uuid: "3ce0812e-9326-4e41-85e7-9d03e534cf65",
    phash: "ef9290696b923c69",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1243.png",
    uuid: "3c46e3ed-2554-41f1-adcb-9bb4c4320f25",
    phash: "eb82941ecb699c36",
    type: "team",
    duplicate: true
  },
  {
    filename: "S10_1261.png",
    uuid: "f00d87d0-0f34-4c7f-a60f-38c1e8a96852",
    phash: "e75a38a1c75e38a1",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1270.png",
    uuid: "c00aaf90-f462-4c74-9645-4bf325a85692",
    phash: "bfa5604a864a9db5",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1273.png",
    uuid: "7bc75896-1ec8-46fa-8800-5f3553bd80c9",
    phash: "894c76b3895c76a3",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1278.png",
    uuid: "93f22f2a-e3e0-400a-8cd6-23f9fb8e0607",
    phash: "e13496cb98c66c79",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1280.png",
    uuid: "f4259467-5221-4e52-8bbe-b9114057c200",
    phash: "ec4bc3b5932c3cc2",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1284.png",
    uuid: "201038b1-a6a9-48a9-9f4b-aee7170e1bbc",
    phash: "c6e13b1ec5c19a36",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1292.png",
    uuid: "8cd530b3-457e-4c39-b9a0-036a2b3f4382",
    phash: "ef13f0a4e792864a",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1312.png",
    uuid: "c6862d88-f28f-40e7-85ca-487768bf52fb",
    phash: "e0d93f6695996066",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1315.png",
    uuid: "8313a0e8-f2d8-4ada-9cf1-0da00d7a8acf",
    phash: "afcaf09297258f24",
    type: "team",
    duplicate: true
  },
  {
    filename: "S10_1316.png",
    uuid: "8bb04861-5199-4dbf-9c00-598913f3a20a",
    phash: "ece4cb9c3033e346",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1320.png",
    uuid: "fb7acffd-996b-4109-8197-58e4ffaeed03",
    phash: "d2cf6d30309f0ed2",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1322.png",
    uuid: "bcabf952-0c2f-4281-ae87-d109c2b73c18",
    phash: "93342dcb72dc3784",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1324.png",
    uuid: "b6bdbe35-2cc2-4b7f-8c66-6efb1ceafde6",
    phash: "ab39d4c26a3995c6",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1326.png",
    uuid: "edbb69ff-026c-4159-9b11-dff5c3d81cc4",
    phash: "c49f6a993968b166",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1330.png",
    uuid: "77542b31-11ce-4af6-9717-573484ca288f",
    phash: "8f85f0780685f97a",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1331.png",
    uuid: "44d3c96c-2876-4acd-a396-207c5470d837",
    phash: "96396b8695397a46",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1332.png",
    uuid: "86cc3b8f-115a-4cf4-9d36-92f2956bc15a",
    phash: "edcc9232c94de634",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1334.png",
    uuid: "44d3c96c-2876-4acd-a396-207c5470d837",
    phash: "96396b8695397a46",
    type: "team",
    duplicate: true
  },
  {
    filename: "S10_1337.png",
    uuid: "0614a4f6-a96c-4c3b-af74-cbdd86c9556d",
    phash: "b333cccc99913ba2",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1338.png",
    uuid: "5fd5b452-7e34-41d3-b830-5d47bda5b0ae",
    phash: "9e39646633c95966",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1339.png",
    uuid: "a05a382e-c82a-4c0b-a2ec-331c2c9e6601",
    phash: "94636b9c3d9c6172",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1343.png",
    uuid: "86cc3b8f-115a-4cf4-9d36-92f2956bc15a",
    phash: "edcc9232c94de634",
    type: "team",
    duplicate: true
  },
  {
    filename: "S10_1347.png",
    uuid: "f2acbaca-7483-49d7-b192-89932c57b430",
    phash: "abd0d02f2fd0d127",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1349.png",
    uuid: "47af53c2-0527-4733-ab68-82216586d744",
    phash: "b8c99336cd31c533",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1350.png",
    uuid: "e53a76e1-c459-446d-b0fe-fd5339702e7b",
    phash: "eb63949c6a63919c",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1353.png",
    uuid: "efc6ae05-83bc-4ebc-9af4-c2690e8614bb",
    phash: "80763fc9c53a7887",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1358.png",
    uuid: "59e06108-f69b-460e-9318-3564a3b0d41e",
    phash: "d1262ed9d1262bd9",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1363.png",
    uuid: "4829ff38-0359-4a84-9327-ec8b99582795",
    phash: "be7ac1853c3bc2c8",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1365.png",
    uuid: "943faba4-044e-43b0-82bb-77c32dbb4f0c",
    phash: "c5c53a3ac5d53a2a",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1368.png",
    uuid: "86646194-a1b4-4526-b92f-931c8468d4f2",
    phash: "bc9dc36272352d98",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1371.png",
    uuid: "a644c90d-5421-491f-9da9-60c4dd2d1cfb",
    phash: "bbc63139c439c4c7",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1372.png",
    uuid: "f419578b-7790-48e7-803c-3422cfb6d422",
    phash: "c0f23a0fc5f27a0d",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1373.png",
    uuid: "8bccac2b-2e9c-4fbf-a772-de4978c64bc6",
    phash: "bf66c0993f6680d1",
    type: "team",
    duplicate: true
  },
  {
    filename: "S10_1376.png",
    uuid: "d40eead9-c8a8-4c9b-918c-edf6f2248669",
    phash: "bb91e42493d9ce31",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1379.png",
    uuid: "4829ff38-0359-4a84-9327-ec8b99582795",
    phash: "be7ac1853c3bc2c8",
    type: "team",
    duplicate: true
  },
  {
    filename: "S10_1383.png",
    uuid: "72f9812a-4102-4cc6-b48d-459ec4abdc09",
    phash: "faa4e1d09725ce58",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1387.png",
    uuid: "929dfb48-54c4-449c-8a14-d5f98316d529",
    phash: "edc486b31b4ec469",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1392.png",
    uuid: "bcc4b0d7-d5a3-444e-8c8e-0f2040f92465",
    phash: "9264c5490bcfce4f",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1393.png",
    uuid: "de29686e-b4d7-4597-94d2-560037c22116",
    phash: "d3792c8693696c96",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1394.png",
    uuid: "c64f18d7-951a-4515-b786-52915d3c17a3",
    phash: "bd87c2189f65c8b2",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1396.png",
    uuid: "bc437b5b-e9ef-41aa-952c-7bd819b1fc45",
    phash: "ba12c5e55a12b5ad",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1397.png",
    uuid: "bcabf952-0c2f-4281-ae87-d109c2b73c18",
    phash: "93342dcb72dc3784",
    type: "team",
    duplicate: true
  },
  {
    filename: "S10_1398.png",
    uuid: "943faba4-044e-43b0-82bb-77c32dbb4f0c",
    phash: "c5c53a3ac5d53a2a",
    type: "team",
    duplicate: true
  },
  {
    filename: "S10_1399.png",
    uuid: "f419578b-7790-48e7-803c-3422cfb6d422",
    phash: "c0f23a0fc5f27a0d",
    type: "team",
    duplicate: true
  },
  {
    filename: "S10_1400.png",
    uuid: "f182841b-5f1e-491e-bc21-5139bedf8360",
    phash: "bc96c3693c96c64a",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1402.png",
    uuid: "3ce0812e-9326-4e41-85e7-9d03e534cf65",
    phash: "ef9290696b923c69",
    type: "team",
    duplicate: true
  },
  {
    filename: "S10_1404.png",
    uuid: "f003073a-0a9b-45a4-b9ec-a995312d35be",
    phash: "b4cb8b32cb2c98e3",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1405.png",
    uuid: "41ddefa5-7fd2-4c8e-9058-0db3b28a8c6b",
    phash: "bad9c5223ad9e522",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1421.png",
    uuid: "8ca7f8c0-41bd-471c-9262-2b5a2817feda",
    phash: "eee291196ae68599",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1423.png",
    uuid: "6c00d099-2ed6-45be-83d2-4eeec853b752",
    phash: "ea3496c3a5d3496c",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1426.png",
    uuid: "d9ece2fd-ef9b-4aee-9b15-85cb1187c375",
    phash: "b8bcc3439cfe3281",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1427.png",
    uuid: "307cc1f3-e0fc-4442-b464-1545538c11ac",
    phash: "8fe0f00f2ff0906b",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1428.png",
    uuid: "5f2ee4c9-d44e-43f9-bbb8-fa58d0a78cb6",
    phash: "fa33c49883c59e4e",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1431.png",
    uuid: "72563b48-d184-48da-911b-83342863cfa7",
    phash: "863979c6863979c6",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1434.png",
    uuid: "073b022a-9c2f-46e2-9d4a-de5280a7e6f6",
    phash: "caa5955a2aa5c57a",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1439.png",
    uuid: "69a4186b-f921-44fd-bcd6-2a32fed1a896",
    phash: "ea1e95e16b1e94c1",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1440.png",
    uuid: "4bd22331-8ce0-47c6-bca7-75bb9a6c4990",
    phash: "956a7a916935863e",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1441.png",
    uuid: "efc6ae05-83bc-4ebc-9af4-c2690e8614bb",
    phash: "80763fc9c53a7887",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1443.png",
    uuid: "fa92c472-5d66-4e31-8c1a-0e29e75dc16d",
    phash: "a346dcb9234695b9",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1444.png",
    uuid: "d9c52585-7e0c-4cf2-8e98-e38c8cbf942f",
    phash: "efa9d0562ea8c42b",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1447.png",
    uuid: "a2a1d170-26ad-4262-9086-6cb0150d477d",
    phash: "c5c13a3ed4c1c93e",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1449.png",
    uuid: "bdf51120-11a4-446a-ac0b-c13b030c09a5",
    phash: "af26d0d12f2ed0d1",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1455.png",
    uuid: "0629aacd-3efb-4cb2-bd11-18931f29c4cc",
    phash: "84ac7b5384ac7b53",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1457.png",
    uuid: "fc37179b-fed3-48e0-b781-9fb1b1d3c3b5",
    phash: "ae5ad1a52e5ac585",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1460.png",
    uuid: "3d44c077-0f29-40f8-9c21-14727b34286a",
    phash: "db7c489737936122",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1462.png",
    uuid: "a003cc24-bad7-437d-a7a8-a3ed233fd906",
    phash: "8195fe680197fe68",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1463.png",
    uuid: "feb51c6f-9ee1-4884-ad98-7d930822f638",
    phash: "eb9684697b968469",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1464.png",
    uuid: "e2383392-6157-423e-ac8c-f053c6d0f99f",
    phash: "bf1ec0e03f1ec0e1",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1466.png",
    uuid: "3cd948ff-eb97-4c2f-a4c1-45c3668d56ea",
    phash: "f885d35a857c46a5",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1471.png",
    uuid: "5d4f471d-072b-4782-9fda-67afea0201d0",
    phash: "a7f8c802257da7a6",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1477.png",
    uuid: "0c07a744-ff52-40c6-81f7-dfb4c6752602",
    phash: "911b4ee43b1b2ce6",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1481.png",
    uuid: "f419578b-7790-48e7-803c-3422cfb6d422",
    phash: "c0f23a0fc5f27a0d",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1482.png",
    uuid: "44b8a909-7890-45fe-8975-6d4e1b587d05",
    phash: "bb6ac4953b6a8495",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1483.png",
    uuid: "d40eead9-c8a8-4c9b-918c-edf6f2248669",
    phash: "bb91e42493d9ce31",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1485.png",
    uuid: "943faba4-044e-43b0-82bb-77c32dbb4f0c",
    phash: "c5c53a3ac5d53a2a",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1486.png",
    uuid: "0c12ab32-2dfb-49eb-aaa6-0ddc5ece0bf1",
    phash: "911b6ee971654696",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1487.png",
    uuid: "22999c57-da3d-47f6-bc38-2bb765d6ca87",
    phash: "fb6a84957b6a8095",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1490.png",
    uuid: "f3dba86b-aa04-4edd-96e1-05cf226a4513",
    phash: "efd0902b6fd0902f",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1494.png",
    uuid: "bdf51120-11a4-446a-ac0b-c13b030c09a5",
    phash: "af26d0d12f2ed0d1",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1496.png",
    uuid: "35db049b-d936-4125-ba9d-fed14ae96a7d",
    phash: "9893674d616cceb2",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1498.png",
    uuid: "f40a0c15-0fba-482a-a8c9-5bac8fa14b41",
    phash: "9661673859ce19e3",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1499.png",
    uuid: "24ade179-2270-417b-9280-331053a9361e",
    phash: "af13b0ccd8b6c632",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1501.png",
    uuid: "e1542039-66c8-40d7-bc24-924f22cf3b56",
    phash: "9f38e0871f78e407",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1506.png",
    uuid: "9ce859cd-334d-44ff-90b7-abe53758beb3",
    phash: "eb7c94832b6cd093",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1510.png",
    uuid: "ac267a00-c9c6-4b54-a53f-f95124950698",
    phash: "aec0c13f3ec0c13f",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1511.png",
    uuid: "72563b48-d184-48da-911b-83342863cfa7",
    phash: "863979c6863979c6",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1512.png",
    uuid: "8e236e5e-9556-40df-a1e0-5471acfb6275",
    phash: "d2633d9cc3639239",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1516.png",
    uuid: "c1431064-e68b-4843-b107-7df5dced16d9",
    phash: "bfc3c0343fcbc034",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1519.png",
    uuid: "8c602998-6ad2-4cb4-b67e-ed9b567fc824",
    phash: "c11f3fc0c13f8ec1",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1520.png",
    uuid: "1b85dc58-2639-455a-a5b0-fafbd73b4085",
    phash: "875cf883077cfc84",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1522.png",
    uuid: "51c0e709-3d0b-473b-b51f-c5a66a3d739d",
    phash: "b864c19bce323a6d",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1525.png",
    uuid: "aed86d0d-87cd-4340-ae64-f8517622ad87",
    phash: "ce66319966669966",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1529.png",
    uuid: "3ce0812e-9326-4e41-85e7-9d03e534cf65",
    phash: "ef9290696b923c69",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1532.png",
    uuid: "3d44c077-0f29-40f8-9c21-14727b34286a",
    phash: "db7c489737936122",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1534.png",
    uuid: "3d44c077-0f29-40f8-9c21-14727b34286a",
    phash: "db7c489737936122",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1535.png",
    uuid: "77542b31-11ce-4af6-9717-573484ca288f",
    phash: "8f85f0780685f97a",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1539.png",
    uuid: "c88f09d1-872d-492d-9586-ed43985c238b",
    phash: "ca48b7bb14b44b4b",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1544.png",
    uuid: "5becadff-1ff9-4e02-8737-e1efb1534775",
    phash: "a9d2d62921d65e69",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1546.png",
    uuid: "f3261682-192d-4312-9df3-48531ed52446",
    phash: "ea2c95c36a3c95c3",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1548.png",
    uuid: "eaf5e816-161d-4e73-949c-c5b774e5e931",
    phash: "ebcbd034352d4ad2",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1552.png",
    uuid: "b81e6e0d-4b69-49e8-971c-6e104c471210",
    phash: "ae27d1d03e27c1d8",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1554.png",
    uuid: "8cd530b3-457e-4c39-b9a0-036a2b3f4382",
    phash: "ef13f0a4e792864a",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1556.png",
    uuid: "8e236e5e-9556-40df-a1e0-5471acfb6275",
    phash: "d2633d9cc3639239",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1558.png",
    uuid: "268848a3-55f1-4d71-b139-1a5d8b421c09",
    phash: "b365cf1a9093c66c",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1559.png",
    uuid: "1e2f21d5-31e9-47ec-98d9-8218ab385ed4",
    phash: "b4e6cf9893493c32",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1560.png",
    uuid: "32d77ba0-5d21-4a46-b1d4-5303ea60e30a",
    phash: "ba99f9c3221cce64",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1562.png",
    uuid: "84276c70-0180-42bc-8683-90d82d77b471",
    phash: "ee84913b6ec4913b",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1565.png",
    uuid: "3ce0812e-9326-4e41-85e7-9d03e534cf65",
    phash: "ef9290696b923c69",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1566.png",
    uuid: "e97272f4-346f-4dc2-9276-03ab912f296f",
    phash: "fef881833a7ec481",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1568.png",
    uuid: "44d3c96c-2876-4acd-a396-207c5470d837",
    phash: "96396b8695397a46",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1572.png",
    uuid: "df8275a9-7169-4973-94d0-0b54b998505f",
    phash: "ee6cb993e48c2661",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1573.png",
    uuid: "3c46e3ed-2554-41f1-adcb-9bb4c4320f25",
    phash: "eb82941ecb699c36",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1577.png",
    uuid: "8557bbff-dd61-4e7b-a0bc-85ed233ca834",
    phash: "d06f2f98d0670f98",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1580.png",
    uuid: "8bb04861-5199-4dbf-9c00-598913f3a20a",
    phash: "ece4cb9c3033e346",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1584.png",
    uuid: "0b90a387-a09d-434b-aae9-4539113a7631",
    phash: "e6e2991de66618cc",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1588.png",
    uuid: "d9b314cb-38b7-4757-ae5b-45ceb0f1e96d",
    phash: "bbb1c44e4e04b9b3",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1589.png",
    uuid: "722df919-923a-4816-94ef-cc5c7f47d943",
    phash: "a3f0d88dd91e0d72",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1591.png",
    uuid: "eaf5e816-161d-4e73-949c-c5b774e5e931",
    phash: "ebcbd034352d4ad2",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1593.png",
    uuid: "f4259467-5221-4e52-8bbe-b9114057c200",
    phash: "ec4bc3b5932c3cc2",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1595.png",
    uuid: "58cd7603-beee-4f0c-8bfe-89a8d817c1bf",
    phash: "adc9d13632c96d34",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1596.png",
    uuid: "090d3a69-e4cd-425e-8efb-70743d24e362",
    phash: "af1dd0626b9d9462",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1597.png",
    uuid: "100edac6-c309-486b-bddf-6c92895ec902",
    phash: "fe3881877e788187",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1598.png",
    uuid: "c00aaf90-f462-4c74-9645-4bf325a85692",
    phash: "bfa5604a864a9db5",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1601.png",
    uuid: "47af53c2-0527-4733-ab68-82216586d744",
    phash: "b8c99336cd31c533",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1604.png",
    uuid: "acdfcef4-ca03-4cd9-a7ec-518c0c5ac19c",
    phash: "e4349bdb34644ab6",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1606.png",
    uuid: "98b667aa-aab3-4501-bc1f-656e89ad5041",
    phash: "ba2dc5d03a2fc5d0",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1607.png",
    uuid: "6e3c1e64-2acd-46d2-bc08-e98f1c37afad",
    phash: "bbb1c44e3ab1b10e",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1608.png",
    uuid: "9eb6b947-6278-44c6-8a06-93b4287400be",
    phash: "91d03e2f0b6de594",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1609.png",
    uuid: "8313a0e8-f2d8-4ada-9cf1-0da00d7a8acf",
    phash: "afcaf09297258f24",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1611.png",
    uuid: "d01bd01d-e4d0-46c7-8d98-19d9b1e4f46c",
    phash: "e83c87cb9a326ccc",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1612.png",
    uuid: "b4470138-a3d7-4432-9097-3dd9c655f51c",
    phash: "91b16ec666293979",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1613.png",
    uuid: "fb7acffd-996b-4109-8197-58e4ffaeed03",
    phash: "d2cf6d30309f0ed2",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1619.png",
    uuid: "226ce6d7-fa25-484f-996b-7713fe12c302",
    phash: "be4f81b094c5ef0a",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1620.png",
    uuid: "0661a455-3b03-4cd0-8c75-37ee91b7d563",
    phash: "d4b72b48c635c393",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1621.png",
    uuid: "47af53c2-0527-4733-ab68-82216586d744",
    phash: "b8c99336cd31c533",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1622.png",
    uuid: "f3261682-192d-4312-9df3-48531ed52446",
    phash: "ea2c95c36a3c95c3",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1626.png",
    uuid: "87aecbb4-34ad-43bd-aa61-618d6dbf1e6b",
    phash: "c4b23b4d3b3264cd",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1628.png",
    uuid: "72f9812a-4102-4cc6-b48d-459ec4abdc09",
    phash: "faa4e1d09725ce58",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1629.png",
    uuid: "77542b31-11ce-4af6-9717-573484ca288f",
    phash: "8f85f0780685f97a",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1630.png",
    uuid: "fb7acffd-996b-4109-8197-58e4ffaeed03",
    phash: "d2cf6d30309f0ed2",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1631.png",
    uuid: "5746bd8c-776a-445b-bad2-9b5673a4f633",
    phash: "bac7cc38c5389387",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1636.png",
    uuid: "080d6b3f-0bfd-491d-a5b4-66aff791910e",
    phash: "81affe7005afc950",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1637.png",
    uuid: "8b2d54f2-99b9-4eb3-b96c-f036ebd4e028",
    phash: "83e0fc1f03c0bc3f",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1639.png",
    uuid: "53a25ea1-02f2-467f-9aca-5b10e1890647",
    phash: "e9e39a9cc03cc36a",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1642.png",
    uuid: "5fd5b452-7e34-41d3-b830-5d47bda5b0ae",
    phash: "9e39646633c95966",
    type: "team",
    duplicate: true
  },
  {
    filename: "S11_1645.png",
    uuid: "da5f295d-3269-45d6-b941-a297533b25e5",
    phash: "c3323cc93bc6c5b1",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1647.png",
    uuid: "96e3ebd7-342a-4119-aec8-f9b86b1b556a",
    phash: "d58aaa319d4f64f0",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1648.png",
    uuid: "d617f46b-03de-4eaf-a586-abdaf591d124",
    phash: "bd94c239976e91e0",
    type: "team",
    duplicate: false
  },
  {
    filename: "S11_1649.png",
    uuid: "8313a0e8-f2d8-4ada-9cf1-0da00d7a8acf",
    phash: "afcaf09297258f24",
    type: "team",
    duplicate: true
  },
  {
    filename: "S12_1656.png",
    uuid: "8313a0e8-f2d8-4ada-9cf1-0da00d7a8acf",
    phash: "afcaf09297258f24",
    type: "team",
    duplicate: true
  },
  {
    filename: "S12_1659.png",
    uuid: "8bccac2b-2e9c-4fbf-a772-de4978c64bc6",
    phash: "bf66c0993f6680d1",
    type: "team",
    duplicate: true
  },
  {
    filename: "S12_1667.png",
    uuid: "b54e7643-8a8d-41a4-8813-739bd31fdc90",
    phash: "be80c13f3ec0c13f",
    type: "team",
    duplicate: false
  },
  {
    filename: "S12_1670.png",
    uuid: "4bd22331-8ce0-47c6-bca7-75bb9a6c4990",
    phash: "956a7a916935863e",
    type: "team",
    duplicate: true
  },
  {
    filename: "S12_1673.png",
    uuid: "6e3c1e64-2acd-46d2-bc08-e98f1c37afad",
    phash: "bbb1c44e3ab1b10e",
    type: "team",
    duplicate: true
  },
  {
    filename: "S12_1678.png",
    uuid: "4db8cd31-47bd-486e-8673-caf969b3fd83",
    phash: "895e73215e93c55c",
    type: "team",
    duplicate: false
  },
  {
    filename: "S12_1685.png",
    uuid: "2120df31-9c5e-4fed-91a5-9ab79d90c65c",
    phash: "e135ca9a3949b666",
    type: "team",
    duplicate: false
  },
  {
    filename: "S12_1691.png",
    uuid: "29f8f5ce-3c5e-4bd5-a98c-e5aec7c7a69f",
    phash: "af84d072668c9bf2",
    type: "team",
    duplicate: false
  },
  {
    filename: "S12_1694.png",
    uuid: "e97272f4-346f-4dc2-9276-03ab912f296f",
    phash: "fef881833a7ec481",
    type: "team",
    duplicate: true
  },
  {
    filename: "S12_1702.png",
    uuid: "42400bc5-5a31-41cb-b89a-bdc3da1bdf81",
    phash: "d4cc6b7395ccc036",
    type: "team",
    duplicate: false
  },
  {
    filename: "S12_1703.png",
    uuid: "6e3c1e64-2acd-46d2-bc08-e98f1c37afad",
    phash: "bbb1c44e3ab1b10e",
    type: "team",
    duplicate: true
  },
  {
    filename: "S12_1707.png",
    uuid: "e51c7ed4-f7ea-4dbd-ae20-673e0c0b2062",
    phash: "9b21250fcb97353c",
    type: "team",
    duplicate: false
  },
  {
    filename: "S12_1713.png",
    uuid: "a003cc24-bad7-437d-a7a8-a3ed233fd906",
    phash: "8195fe680197fe68",
    type: "team",
    duplicate: true
  },
  {
    filename: "S12_1725.png",
    uuid: "a34bfd37-4367-4341-8e24-9edd07daa6ab",
    phash: "af0ed0f02f2ad495",
    type: "team",
    duplicate: false
  },
  {
    filename: "S12_1731.png",
    uuid: "f40a0c15-0fba-482a-a8c9-5bac8fa14b41",
    phash: "9661673859ce19e3",
    type: "team",
    duplicate: true
  },
  {
    filename: "S12_1738.png",
    uuid: "4e6e921e-62af-43fc-b31b-280b097b1ea0",
    phash: "eba0945e6ba1945e",
    type: "team",
    duplicate: false
  },
  {
    filename: "S12_1743.png",
    uuid: "8bccac2b-2e9c-4fbf-a772-de4978c64bc6",
    phash: "bf66c0993f6680d1",
    type: "team",
    duplicate: true
  },
  {
    filename: "S12_1744.png",
    uuid: "be474274-d4ae-45c5-ae64-17c2fc1e0ae9",
    phash: "91376ec891376ec8",
    type: "team",
    duplicate: false
  },
  {
    filename: "S12_1746.png",
    uuid: "32d77ba0-5d21-4a46-b1d4-5303ea60e30a",
    phash: "ba99f9c3221cce64",
    type: "team",
    duplicate: true
  },
  {
    filename: "S12_1748.png",
    uuid: "feb51c6f-9ee1-4884-ad98-7d930822f638",
    phash: "eb9684697b968469",
    type: "team",
    duplicate: true
  },
  {
    filename: "S12_1750.png",
    uuid: "375e8094-3129-44c4-82a5-2bb52c82f982",
    phash: "e492d7695bc63c30",
    type: "team",
    duplicate: false
  },
  {
    filename: "S12_1757.png",
    uuid: "2120df31-9c5e-4fed-91a5-9ab79d90c65c",
    phash: "e135ca9a3949b666",
    type: "team",
    duplicate: true
  },
  {
    filename: "S12_1765.png",
    uuid: "ab005ab0-d942-465a-856f-69beecc00e6f",
    phash: "a8f5921add0ac7c6",
    type: "team",
    duplicate: false
  },
  {
    filename: "S12_1769.png",
    uuid: "86cc3b8f-115a-4cf4-9d36-92f2956bc15a",
    phash: "edcc9232c94de634",
    type: "team",
    duplicate: true
  },
  {
    filename: "S12_1771.png",
    uuid: "14ec36a3-c268-4105-a0cb-b621b5cbea9e",
    phash: "9c613a2b739c6574",
    type: "team",
    duplicate: false
  },
  {
    filename: "S12_1773.png",
    uuid: "28c0a1d8-e86b-4014-96ba-d6335866a9e5",
    phash: "cba0945f4ba0b45f",
    type: "team",
    duplicate: true
  },
  {
    filename: "S12_1774.png",
    uuid: "226ce6d7-fa25-484f-996b-7713fe12c302",
    phash: "be4f81b094c5ef0a",
    type: "team",
    duplicate: true
  },
  {
    filename: "S12_1779.png",
    uuid: "6d8398ef-d9f9-4e16-bf4f-8cd51b373463",
    phash: "b061cf96c7cc6493",
    type: "team",
    duplicate: false
  },
  {
    filename: "S12_1781.png",
    uuid: "412137f3-009b-4971-afdd-736129e13533",
    phash: "942b6af0a58bd62d",
    type: "team",
    duplicate: false
  },
  {
    filename: "S12_1782.png",
    uuid: "35db049b-d936-4125-ba9d-fed14ae96a7d",
    phash: "9893674d616cceb2",
    type: "team",
    duplicate: true
  },
  {
    filename: "S12_1794.png",
    uuid: "5becadff-1ff9-4e02-8737-e1efb1534775",
    phash: "a9d2d62921d65e69",
    type: "team",
    duplicate: true
  },
  {
    filename: "S12_1795.png",
    uuid: "41ddefa5-7fd2-4c8e-9058-0db3b28a8c6b",
    phash: "bad9c5223ad9e522",
    type: "team",
    duplicate: true
  },
  {
    filename: "S13_1813.png",
    uuid: "efc6ae05-83bc-4ebc-9af4-c2690e8614bb",
    phash: "80763fc9c53a7887",
    type: "team",
    duplicate: true
  },
  {
    filename: "S13_1828.png",
    uuid: "eaf5e816-161d-4e73-949c-c5b774e5e931",
    phash: "ebcbd034352d4ad2",
    type: "team",
    duplicate: true
  },
  {
    filename: "S13_1830.png",
    uuid: "99fbe245-a9d9-4704-937f-aa86f8ef1e15",
    phash: "af93a52cb4b332c8",
    type: "team",
    duplicate: false
  },
  {
    filename: "S13_1834.png",
    uuid: "3377eb80-eac4-4748-abd2-3bd0925034ee",
    phash: "c7986d4f3036199b",
    type: "team",
    duplicate: false
  },
  {
    filename: "S13_1839.png",
    uuid: "94e8b53d-aa60-4367-af3b-aa5c34fcfb6e",
    phash: "c46b6ea1319233cf",
    type: "team",
    duplicate: false
  },
  {
    filename: "S13_1845.png",
    uuid: "b35740a8-7822-42bb-bc17-d748814391cd",
    phash: "e87897876c789187",
    type: "team",
    duplicate: false
  },
  {
    filename: "S13_1854.png",
    uuid: "dac95e2b-5aa5-4bca-9697-7c0131596e39",
    phash: "ea8e85e1d032c76b",
    type: "team",
    duplicate: false
  },
  {
    filename: "S13_1864.png",
    uuid: "bea9c4a5-3a80-4ff0-8462-ce017d6994d7",
    phash: "ef66f0989b0d0d43",
    type: "team",
    duplicate: false
  },
  {
    filename: "S13_1870.png",
    uuid: "d9c7de21-14e9-439a-bcd6-6e4639a4a26b",
    phash: "a4d9bb6671897461",
    type: "team",
    duplicate: false
  },
  {
    filename: "S13_1877.png",
    uuid: "89cb58f7-cd19-4adf-9986-86e6e646508b",
    phash: "aa90d57f3b80407f",
    type: "team",
    duplicate: false
  },
  {
    filename: "S13_1880.png",
    uuid: "dc582cc1-1ed7-410e-a124-457f5c214e88",
    phash: "cc333364e6999966",
    type: "team",
    duplicate: false
  },
  {
    filename: "S13_1881.png",
    uuid: "8e37476a-5745-4599-b4b0-f3c2d663ac30",
    phash: "af2bd0d40f3b2b84",
    type: "team",
    duplicate: false
  },
  {
    filename: "S13_1886.png",
    uuid: "f40a0c15-0fba-482a-a8c9-5bac8fa14b41",
    phash: "9661673859ce19e3",
    type: "team",
    duplicate: true
  },
  {
    filename: "S13_1889.png",
    uuid: "589bb3aa-11b1-4dbe-94c0-d79a6a853c35",
    phash: "9866673939c69639",
    type: "team",
    duplicate: false
  },
  {
    filename: "S13_1892.png",
    uuid: "68580b64-96d1-46f0-ae5a-1952385e3da2",
    phash: "e61f9960629f9d60",
    type: "team",
    duplicate: false
  },
  {
    filename: "S13_1893.png",
    uuid: "22ca7774-c340-439b-b698-67be94c9a4fe",
    phash: "838f18b04fc6731f",
    type: "team",
    duplicate: true
  },
  {
    filename: "S13_1894.png",
    uuid: "706a0a11-ad3c-48d8-a29d-fabc755a2a36",
    phash: "84e71fde68586178",
    type: "team",
    duplicate: false
  },
  {
    filename: "S13_1896.png",
    uuid: "acdfcef4-ca03-4cd9-a7ec-518c0c5ac19c",
    phash: "e4349bdb34644ab6",
    type: "team",
    duplicate: true
  },
  {
    filename: "S13_1897.png",
    uuid: "f40a0c15-0fba-482a-a8c9-5bac8fa14b41",
    phash: "9661673859ce19e3",
    type: "team",
    duplicate: true
  },
  {
    filename: "S13_1901.png",
    uuid: "f0493613-c15b-4462-aef0-9f7c9d65dac8",
    phash: "acc3ff90b1c68392",
    type: "team",
    duplicate: false
  },
  {
    filename: "S13_1902.png",
    uuid: "8876949d-8601-4bce-8746-be6f220cbcda",
    phash: "c5d948c43b764e1b",
    type: "team",
    duplicate: false
  },
  {
    filename: "S13_1903.png",
    uuid: "5d15f09c-de50-4d36-99b0-78625aa662ed",
    phash: "d54a6a95946a6b95",
    type: "team",
    duplicate: false
  },
  {
    filename: "S13_1907.png",
    uuid: "ea2e6135-b753-4305-9b43-ffe45a789631",
    phash: "c1663e99856359b6",
    type: "team",
    duplicate: false
  },
  {
    filename: "S13_1908.png",
    uuid: "f0493613-c15b-4462-aef0-9f7c9d65dac8",
    phash: "acc3ff90b1c68392",
    type: "team",
    duplicate: true
  },
  {
    filename: "S13_1909.png",
    uuid: "3d44c077-0f29-40f8-9c21-14727b34286a",
    phash: "db7c489737936122",
    type: "team",
    duplicate: true
  },
  {
    filename: "S13_1913.png",
    uuid: "102b0450-57c3-4f13-8a19-da2cc6c784df",
    phash: "d0bd2f42d43d2bc2",
    type: "team",
    duplicate: false
  },
  {
    filename: "S13_1920.png",
    uuid: "8789cab6-a8d4-40f0-a8ae-6cc9b97e9031",
    phash: "e4399fc663e13438",
    type: "team",
    duplicate: false
  },
  {
    filename: "S13_1921.png",
    uuid: "730d6841-8292-4db9-a016-8ed0f4c4dc60",
    phash: "936d6c92c56c3a1b",
    type: "team",
    duplicate: false
  },
  {
    filename: "S13_1922.png",
    uuid: "226ce6d7-fa25-484f-996b-7713fe12c302",
    phash: "be4f81b094c5ef0a",
    type: "team",
    duplicate: true
  },
  {
    filename: "S13_1925.png",
    uuid: "4f2f9b1f-f4c2-4f61-994d-b59ccfc821a3",
    phash: "fa5d85a03a5fc5a0",
    type: "team",
    duplicate: false
  },
  {
    filename: "S13_1935.png",
    uuid: "73ac24fb-858d-4812-9545-c27a99f7033f",
    phash: "c7c33c3c61c3963c",
    type: "team",
    duplicate: false
  },
  {
    filename: "S13_1939.png",
    uuid: "1a934123-7d8e-491f-8061-1dc0d01ca275",
    phash: "a6cecf3199936446",
    type: "team",
    duplicate: false
  },
  {
    filename: "S13_1942.png",
    uuid: "1e2f21d5-31e9-47ec-98d9-8218ab385ed4",
    phash: "b4e6cf9893493c32",
    type: "team",
    duplicate: true
  },
  {
    filename: "S13_1943.png",
    uuid: "be6f45b8-5dcf-405d-a85c-51031ccf5404",
    phash: "a065cf9a98cd659a",
    type: "team",
    duplicate: false
  },
  {
    filename: "S13_1946.png",
    uuid: "ce65289f-cc09-4cc6-b9cc-0cd4e8c96049",
    phash: "9b3030cdcdb3936c",
    type: "team",
    duplicate: false
  },
  {
    filename: "S13_1948.png",
    uuid: "5fd5b452-7e34-41d3-b830-5d47bda5b0ae",
    phash: "9e39646633c95966",
    type: "team",
    duplicate: true
  },
  {
    filename: "S13_1954.png",
    uuid: "5353875a-821d-425a-b5c5-ec6810ae6e95",
    phash: "c7cf3d3c26643892",
    type: "team",
    duplicate: false
  },
  {
    filename: "S13_1956.png",
    uuid: "6e3c1e64-2acd-46d2-bc08-e98f1c37afad",
    phash: "bbb1c44e3ab1b10e",
    type: "team",
    duplicate: true
  },
  {
    filename: "S13_1961.png",
    uuid: "3d44c077-0f29-40f8-9c21-14727b34286a",
    phash: "db7c489737936122",
    type: "team",
    duplicate: true
  },
  {
    filename: "S13_1962.png",
    uuid: "9dce78e8-1ab8-4ae3-972d-623863f4a7ae",
    phash: "95856a7a95856a7a",
    type: "team",
    duplicate: false
  },
  {
    filename: "S13_1968.png",
    uuid: "659dc22d-2274-4d0d-84b0-a5a334cb081c",
    phash: "eac4953b6ac4833b",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_1970.png",
    uuid: "bc437b5b-e9ef-41aa-952c-7bd819b1fc45",
    phash: "ba12c5e55a12b5ad",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_1975.png",
    uuid: "5fd5b452-7e34-41d3-b830-5d47bda5b0ae",
    phash: "9e39646633c95966",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_1978.png",
    uuid: "2d6239c1-1712-4650-91b5-f71156600197",
    phash: "ba96c4693a96cc69",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_1979.png",
    uuid: "43299f67-d055-4d0a-a695-a94b8c953a60",
    phash: "af84d06b6f94906b",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_1982.png",
    uuid: "67652417-d49a-4ee8-834f-a7b6edfa95c2",
    phash: "ea7895856a7a9585",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_1987.png",
    uuid: "1c40e8f7-0e49-4629-896f-59e0ca0bdc9f",
    phash: "fa1a85a19a86c977",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_1993.png",
    uuid: "35db049b-d936-4125-ba9d-fed14ae96a7d",
    phash: "9893674d616cceb2",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_1996.png",
    uuid: "307cc1f3-e0fc-4442-b464-1545538c11ac",
    phash: "8fe0f00f2ff0906b",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_1997.png",
    uuid: "607a88d2-fdae-4b8d-9085-a878e9a01942",
    phash: "ac96c3498eb49973",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2000.png",
    uuid: "fa92c472-5d66-4e31-8c1a-0e29e75dc16d",
    phash: "a346dcb9234695b9",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_2001.png",
    uuid: "44d3c96c-2876-4acd-a396-207c5470d837",
    phash: "96396b8695397a46",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_2004.png",
    uuid: "28c3ee22-921a-4d96-a69d-42681b403348",
    phash: "d48c2b33d4cc2f33",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2005.png",
    uuid: "b35740a8-7822-42bb-bc17-d748814391cd",
    phash: "e87897876c789187",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_2006.png",
    uuid: "a34bfd37-4367-4341-8e24-9edd07daa6ab",
    phash: "af0ed0f02f2ad495",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_2010.png",
    uuid: "19cc66e4-e75b-45a6-96c5-127c9fb440aa",
    phash: "c4927b6c9693696c",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2016.png",
    uuid: "4bd22331-8ce0-47c6-bca7-75bb9a6c4990",
    phash: "956a7a916935863e",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_2017.png",
    uuid: "fe233a0e-a9aa-4d7f-93be-c556640e9ca0",
    phash: "9de66219bde6021d",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2019.png",
    uuid: "a34bfd37-4367-4341-8e24-9edd07daa6ab",
    phash: "af0ed0f02f2ad495",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_2022.png",
    uuid: "8ca7f8c0-41bd-471c-9262-2b5a2817feda",
    phash: "eee291196ae68599",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_2026.png",
    uuid: "484b536e-e1ae-4b6c-be4e-bfbe48d23fd1",
    phash: "d4783b87c4787a85",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2030.png",
    uuid: "8313a0e8-f2d8-4ada-9cf1-0da00d7a8acf",
    phash: "afcaf09297258f24",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_2032.png",
    uuid: "44d3c96c-2876-4acd-a396-207c5470d837",
    phash: "96396b8695397a46",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_2033.png",
    uuid: "1e2f21d5-31e9-47ec-98d9-8218ab385ed4",
    phash: "b4e6cf9893493c32",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_2034.png",
    uuid: "ff5e4995-7eb1-4ddc-91e1-5a136b94bcf7",
    phash: "c11c6c6396b06f1f",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2041.png",
    uuid: "a52ad0ab-b7fd-4b28-92bb-0b5835440f98",
    phash: "ab1fd4e02b1f96c0",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2042.png",
    uuid: "47af53c2-0527-4733-ab68-82216586d744",
    phash: "b8c99336cd31c533",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_2044.png",
    uuid: "62e220ba-3b05-4f62-8fb3-3980343f5ad8",
    phash: "846f1a3a5f317945",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2045.png",
    uuid: "977842aa-2c59-4ccc-a93d-9c14599cbd17",
    phash: "9a3ce5c31a3dec82",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2048.png",
    uuid: "a63c0b9f-1745-4fd5-98d3-07d39534af56",
    phash: "b173ce8c3173c68c",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2051.png",
    uuid: "08b35d5d-34f6-42d1-8d6b-c75183c3a55c",
    phash: "944a3fbd6394e462",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2052.png",
    uuid: "3d44c077-0f29-40f8-9c21-14727b34286a",
    phash: "db7c489737936122",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_2053.png",
    uuid: "4c90102c-022e-4b51-9e56-883caabf63dc",
    phash: "999a66613266cd9b",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2058.png",
    uuid: "08bc0a40-e548-40eb-8db7-9c8563975238",
    phash: "cf9838e7641c3333",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2059.png",
    uuid: "f0493613-c15b-4462-aef0-9f7c9d65dac8",
    phash: "acc3ff90b1c68392",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_2060.png",
    uuid: "94e8b53d-aa60-4367-af3b-aa5c34fcfb6e",
    phash: "c46b6ea1319233cf",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_2062.png",
    uuid: "e9103da7-5782-4562-a71f-7fbe7ec6b05c",
    phash: "beb4c44ac94f9391",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2064.png",
    uuid: "c4066dd5-59b8-452d-8698-e5ead8c2211e",
    phash: "af95976ac295604b",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2065.png",
    uuid: "5fd5b452-7e34-41d3-b830-5d47bda5b0ae",
    phash: "9e39646633c95966",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_2066.png",
    uuid: "551cd109-7451-41a5-9603-2582c4e45c78",
    phash: "c90f3e70672536d2",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2068.png",
    uuid: "cf0ff900-b0fc-48dc-aa47-b4d3efb40b23",
    phash: "9f38e0c11d3eea61",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2069.png",
    uuid: "b2db7dd8-9bb1-4f52-bfd8-b2db7f1b1ea4",
    phash: "bc78c30761c99eb4",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2071.png",
    uuid: "bea9c4a5-3a80-4ff0-8462-ce017d6994d7",
    phash: "ef66f0989b0d0d43",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_2073.png",
    uuid: "375e8094-3129-44c4-82a5-2bb52c82f982",
    phash: "e492d7695bc63c30",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_2074.png",
    uuid: "c660dd74-5fb4-4ad7-bbe6-1ffe60993343",
    phash: "c59a3b67b8b84345",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2075.png",
    uuid: "89b613ee-0afb-4a7e-99cd-47bea684f162",
    phash: "eb91946a6b95946a",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2077.png",
    uuid: "2120df31-9c5e-4fed-91a5-9ab79d90c65c",
    phash: "e135ca9a3949b666",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_2079.png",
    uuid: "d6a8510f-0d6c-4bb4-bcfa-ecc50fdc990e",
    phash: "a282df7d2082d75d",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2080.png",
    uuid: "e3b6094c-aea6-4b32-9020-cdcd875a6b93",
    phash: "f993866c3993866c",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2081.png",
    uuid: "1f9d89df-02ef-4577-8906-d95230c4d24d",
    phash: "e6c69338ccc73619",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2082.png",
    uuid: "90d1c4f8-aced-40b0-8ccf-ba1eba4a2f32",
    phash: "a766cc999991316e",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2083.png",
    uuid: "80dad1eb-614a-41f6-82ee-01c05f9807d7",
    phash: "ea0dd5722a0dc772",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2085.png",
    uuid: "299889cd-64f5-42d3-ab18-c61b0ff32150",
    phash: "eeb091464ab83fc5",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2086.png",
    uuid: "fb7fbca2-148f-4af6-94cd-67c758d5c916",
    phash: "a1e5de83d5588974",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_2090.png",
    uuid: "f5b1e2d9-51f2-4e71-9804-288f8e4dede1",
    phash: "838df860039fff60",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2094.png",
    uuid: "5fd5b452-7e34-41d3-b830-5d47bda5b0ae",
    phash: "9e39646633c95966",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_2096.png",
    uuid: "f16d15aa-7a12-42a8-a5a9-715363e3b619",
    phash: "91496eb499cfc139",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2101.png",
    uuid: "ece61de6-4e65-4e0b-b3af-de6a0fff3f23",
    phash: "ef8790386e8791d8",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2102.png",
    uuid: "3c365ce3-efea-4a8a-a72e-154032fb5fab",
    phash: "abc0d43e2fc1d03e",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2105.png",
    uuid: "e97272f4-346f-4dc2-9276-03ab912f296f",
    phash: "fef881833a7ec481",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_2107.png",
    uuid: "df8275a9-7169-4973-94d0-0b54b998505f",
    phash: "ee6cb993e48c2661",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_2109.png",
    uuid: "6abafc5d-2ff5-477a-9050-c3a1aa57c1bf",
    phash: "e9c1863e9039b6c7",
    type: "team",
    duplicate: false
  },
  {
    filename: "S14_2112.png",
    uuid: "aed86d0d-87cd-4340-ae64-f8517622ad87",
    phash: "ce66319966669966",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_2117.png",
    uuid: "bcabf952-0c2f-4281-ae87-d109c2b73c18",
    phash: "93342dcb72dc3784",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_2118.png",
    uuid: "86cc3b8f-115a-4cf4-9d36-92f2956bc15a",
    phash: "edcc9232c94de634",
    type: "team",
    duplicate: true
  },
  {
    filename: "S14_2119.png",
    uuid: "f0493613-c15b-4462-aef0-9f7c9d65dac8",
    phash: "acc3ff90b1c68392",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2120.png",
    uuid: "befe0bdf-78e9-4e9b-9568-207fcfdffbac",
    phash: "bc2dc3d23c2dc1d2",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2123.png",
    uuid: "a308b715-0cd9-45ce-b227-04e8108974af",
    phash: "91e64f196ce63139",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2126.png",
    uuid: "d7ed2c73-61c0-443d-bfec-5d52f68a789b",
    phash: "d4e1eb9694192b36",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2127.png",
    uuid: "5c5217d2-88c4-4baf-9432-853c4ab1ba2c",
    phash: "a6b49ec3c3699c34",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2128.png",
    uuid: "1c5fe460-f24b-4d28-bb82-e115910f1dd8",
    phash: "adc6d219cf643833",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2129.png",
    uuid: "1f6cc605-7078-4200-a14d-f19d40781185",
    phash: "bbb19a4ec43a3991",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2130.png",
    uuid: "3c02803f-0e44-408d-b5d0-1b4b8430eff1",
    phash: "be93c16c2e93946c",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2131.png",
    uuid: "a34bfd37-4367-4341-8e24-9edd07daa6ab",
    phash: "af0ed0f02f2ad495",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2132.png",
    uuid: "2f66e923-d1ce-4b43-aac9-fd71a442d289",
    phash: "ea83957c6a83857c",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2133.png",
    uuid: "00b607a0-ab3c-498b-9be8-d088bef964f3",
    phash: "ef3290856f72948d",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2134.png",
    uuid: "d194e640-eea9-4a16-8b00-d95cbbb36456",
    phash: "b9b1c2e3198ee46c",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2136.png",
    uuid: "cf0ff900-b0fc-48dc-aa47-b4d3efb40b23",
    phash: "9f38e0c11d3eea61",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2137.png",
    uuid: "b82e2860-18ac-4495-97f0-5588a340b1bb",
    phash: "f100aacf3930e5cf",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2138.png",
    uuid: "8e5fefc3-d69d-4a70-96a6-96ba875a6626",
    phash: "957b6a84953b6ac4",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2139.png",
    uuid: "77baf26a-fb12-4692-9a79-d03ae729dfd7",
    phash: "bf0ec0e13d846a6b",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2141.png",
    uuid: "6ceb5103-9a07-415b-8d0e-57b1c8c724df",
    phash: "b8e3259d07cb5887",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2142.png",
    uuid: "9a5adebe-c11e-4da3-a3e5-d11eaff309fe",
    phash: "bf3bc0c42a021f3f",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2143.png",
    uuid: "b4470138-a3d7-4432-9097-3dd9c655f51c",
    phash: "91b16ec666293979",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2144.png",
    uuid: "f1dbcea4-e6c9-46b4-bef4-3cb43fd1fdc6",
    phash: "929a6de5961b33a4",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2145.png",
    uuid: "dc4d73fe-fbd9-4dac-a8a3-2f1583442d1a",
    phash: "84b71fca781d6169",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2146.png",
    uuid: "8e37476a-5745-4599-b4b0-f3c2d663ac30",
    phash: "af2bd0d40f3b2b84",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2147.png",
    uuid: "e01a3690-7e33-44e0-a4e0-1f68ec2e74e1",
    phash: "891b3764ce19b167",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2149.png",
    uuid: "3d44c077-0f29-40f8-9c21-14727b34286a",
    phash: "db7c489737936122",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2151.png",
    uuid: "3ce0812e-9326-4e41-85e7-9d03e534cf65",
    phash: "ef9290696b923c69",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2152.png",
    uuid: "3ce0812e-9326-4e41-85e7-9d03e534cf65",
    phash: "ef9290696b923c69",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2153.png",
    uuid: "5fd5b452-7e34-41d3-b830-5d47bda5b0ae",
    phash: "9e39646633c95966",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2154.png",
    uuid: "53951f68-316b-4384-a333-012e3d54ff56",
    phash: "e9c1963e6961629e",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2155.png",
    uuid: "809a606f-c3a3-4ea3-979a-2ed3a390836d",
    phash: "ab2fd4c02b3fd4c0",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2157.png",
    uuid: "f0493613-c15b-4462-aef0-9f7c9d65dac8",
    phash: "acc3ff90b1c68392",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2158.png",
    uuid: "87c857a1-7944-4b97-9110-222e371b7dca",
    phash: "9ff0e00f03729e9c",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2159.png",
    uuid: "d70ba916-4a3e-4b4e-a61c-b75e54f0187d",
    phash: "98586f9790786d87",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2160.png",
    uuid: "39b90c9e-0e1c-433e-b069-d62f23c4fb20",
    phash: "afc0d02d2fc0d13f",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2161.png",
    uuid: "3d44c077-0f29-40f8-9c21-14727b34286a",
    phash: "db7c489737936122",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2162.png",
    uuid: "f419578b-7790-48e7-803c-3422cfb6d422",
    phash: "c0f23a0fc5f27a0d",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2163.png",
    uuid: "6d8398ef-d9f9-4e16-bf4f-8cd51b373463",
    phash: "b061cf96c7cc6493",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2164.png",
    uuid: "eaf5e816-161d-4e73-949c-c5b774e5e931",
    phash: "ebcbd034352d4ad2",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2165.png",
    uuid: "fef43e55-6037-4ea8-a53b-f297b08e1306",
    phash: "e0901f6fe0901f6f",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2166.png",
    uuid: "be6f45b8-5dcf-405d-a85c-51031ccf5404",
    phash: "a065cf9a98cd659a",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2167.png",
    uuid: "bea9c4a5-3a80-4ff0-8462-ce017d6994d7",
    phash: "ef66f0989b0d0d43",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2168.png",
    uuid: "f40a0c15-0fba-482a-a8c9-5bac8fa14b41",
    phash: "9661673859ce19e3",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2170.png",
    uuid: "8e37476a-5745-4599-b4b0-f3c2d663ac30",
    phash: "af2bd0d40f3b2b84",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2171.png",
    uuid: "f0493613-c15b-4462-aef0-9f7c9d65dac8",
    phash: "acc3ff90b1c68392",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2172.png",
    uuid: "4d3fc49b-44b1-42d0-8e3e-4247245e8db5",
    phash: "b98cc6731a0e61ed",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2174.png",
    uuid: "607a88d2-fdae-4b8d-9085-a878e9a01942",
    phash: "ac96c3498eb49973",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2175.png",
    uuid: "6ad5bac6-ffbc-4f08-96ad-2b82b19e424a",
    phash: "b191cf679118d663",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2176.png",
    uuid: "42cac9f1-8bb6-4622-8d56-2799491173b2",
    phash: "af49c0c59f368cc9",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2177.png",
    uuid: "a52ad0ab-b7fd-4b28-92bb-0b5835440f98",
    phash: "ab1fd4e02b1f96c0",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2179.png",
    uuid: "dbc61014-4edd-40fc-912e-b53f2ab2e5b8",
    phash: "93b46cc9973472ca",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2180.png",
    uuid: "81578235-9330-44f2-9cc5-395c13f3fd5a",
    phash: "af2790d86f2790d8",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2181.png",
    uuid: "299889cd-64f5-42d3-ab18-c61b0ff32150",
    phash: "eeb091464ab83fc5",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2182.png",
    uuid: "8e37476a-5745-4599-b4b0-f3c2d663ac30",
    phash: "af2bd0d40f3b2b84",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2183.png",
    uuid: "4e03f3ba-7d0a-4a51-a309-8fe79a8f63e3",
    phash: "cc3133cecc39cc93",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2184.png",
    uuid: "5353875a-821d-425a-b5c5-ec6810ae6e95",
    phash: "c7cf3d3c26643892",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2185.png",
    uuid: "e9ea834c-6420-4d78-9bf8-09db6a095233",
    phash: "fae79470839a489b",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2186.png",
    uuid: "9ea63270-fef2-4a0a-a975-c1f2c2886937",
    phash: "bb87c4683f97c068",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2187.png",
    uuid: "b4bf00cb-29f6-4219-b034-98ff8b996931",
    phash: "aee1f195e05b850e",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2188.png",
    uuid: "adcff0a3-1c4f-4e96-b41c-2c116e6c1abe",
    phash: "afe0f88785c2528f",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2189.png",
    uuid: "96e3ebd7-342a-4119-aec8-f9b86b1b556a",
    phash: "d58aaa319d4f64f0",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2191.png",
    uuid: "fa83cb7d-653f-440e-bdb3-b0253c1a8fa1",
    phash: "be95c1683e97c168",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2192.png",
    uuid: "f40a0c15-0fba-482a-a8c9-5bac8fa14b41",
    phash: "9661673859ce19e3",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2193.png",
    uuid: "b35740a8-7822-42bb-bc17-d748814391cd",
    phash: "e87897876c789187",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2194.png",
    uuid: "5becadff-1ff9-4e02-8737-e1efb1534775",
    phash: "a9d2d62921d65e69",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2195.png",
    uuid: "22ca7774-c340-439b-b698-67be94c9a4fe",
    phash: "838f18b04fc6731f",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2196.png",
    uuid: "ea2e6135-b753-4305-9b43-ffe45a789631",
    phash: "c1663e99856359b6",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2197.png",
    uuid: "e9ea834c-6420-4d78-9bf8-09db6a095233",
    phash: "fae79470839a489b",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2198.png",
    uuid: "6c793691-dab1-4ffb-acfc-4f99947fe730",
    phash: "fe1c80e37f1c84e1",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2199.png",
    uuid: "4e7aafd0-be26-40fc-8c15-35db6490b3ab",
    phash: "ee38b0cfb132c631",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2201.png",
    uuid: "e9ea834c-6420-4d78-9bf8-09db6a095233",
    phash: "fae79470839a489b",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2203.png",
    uuid: "befe0bdf-78e9-4e9b-9568-207fcfdffbac",
    phash: "bc2dc3d23c2dc1d2",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2204.png",
    uuid: "a63c0b9f-1745-4fd5-98d3-07d39534af56",
    phash: "b173ce8c3173c68c",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2205.png",
    uuid: "6e3c1e64-2acd-46d2-bc08-e98f1c37afad",
    phash: "bbb1c44e3ab1b10e",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2206.png",
    uuid: "dc942d90-f1b7-431d-a10b-93e9823e27aa",
    phash: "95846a7b95846a7b",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2207.png",
    uuid: "293d8e74-2a11-483c-8e54-cf3cf7f27c83",
    phash: "c1611e943e9e6acb",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2208.png",
    uuid: "6d8398ef-d9f9-4e16-bf4f-8cd51b373463",
    phash: "b061cf96c7cc6493",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2209.png",
    uuid: "a0b6e63d-3aa0-42a1-957c-c05c4901dd39",
    phash: "aec8d1373ec8c135",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2211.png",
    uuid: "540a32a1-2263-4636-9b00-925c73cec8ef",
    phash: "bb8d8463c71eb0a5",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2214.png",
    uuid: "b35740a8-7822-42bb-bc17-d748814391cd",
    phash: "e87897876c789187",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2215.png",
    uuid: "44b8a909-7890-45fe-8975-6d4e1b587d05",
    phash: "bb6ac4953b6a8495",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2216.png",
    uuid: "19cc66e4-e75b-45a6-96c5-127c9fb440aa",
    phash: "c4927b6c9693696c",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2218.png",
    uuid: "5fd5b452-7e34-41d3-b830-5d47bda5b0ae",
    phash: "9e39646633c95966",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2220.png",
    uuid: "e9ea834c-6420-4d78-9bf8-09db6a095233",
    phash: "fae79470839a489b",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2221.png",
    uuid: "99fbe245-a9d9-4704-937f-aa86f8ef1e15",
    phash: "af93a52cb4b332c8",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2222.png",
    uuid: "befe0bdf-78e9-4e9b-9568-207fcfdffbac",
    phash: "bc2dc3d23c2dc1d2",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2223.png",
    uuid: "226ce6d7-fa25-484f-996b-7713fe12c302",
    phash: "be4f81b094c5ef0a",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2224.png",
    uuid: "87ad501c-8157-4568-8a85-bc65d6074960",
    phash: "cdcc3232ccc79b98",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2225.png",
    uuid: "bea9c4a5-3a80-4ff0-8462-ce017d6994d7",
    phash: "ef66f0989b0d0d43",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2226.png",
    uuid: "f0493613-c15b-4462-aef0-9f7c9d65dac8",
    phash: "acc3ff90b1c68392",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2227.png",
    uuid: "a52ad0ab-b7fd-4b28-92bb-0b5835440f98",
    phash: "ab1fd4e02b1f96c0",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2228.png",
    uuid: "86cc3b8f-115a-4cf4-9d36-92f2956bc15a",
    phash: "edcc9232c94de634",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2229.png",
    uuid: "86cc3b8f-115a-4cf4-9d36-92f2956bc15a",
    phash: "edcc9232c94de634",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2230.png",
    uuid: "28c0a1d8-e86b-4014-96ba-d6335866a9e5",
    phash: "cba0945f4ba0b45f",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2231.png",
    uuid: "1e2f21d5-31e9-47ec-98d9-8218ab385ed4",
    phash: "b4e6cf9893493c32",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2232.png",
    uuid: "1e2f21d5-31e9-47ec-98d9-8218ab385ed4",
    phash: "b4e6cf9893493c32",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2233.png",
    uuid: "08e23f3b-00dd-45b2-8a47-925ae224eba4",
    phash: "fb9884667b998466",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2234.png",
    uuid: "2d6239c1-1712-4650-91b5-f71156600197",
    phash: "ba96c4693a96cc69",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2235.png",
    uuid: "42cac9f1-8bb6-4622-8d56-2799491173b2",
    phash: "af49c0c59f368cc9",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2236.png",
    uuid: "b44be7e3-af88-464f-a81b-d772b6a7219d",
    phash: "d02e2fd1d02e3fc1",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2238.png",
    uuid: "a34bfd37-4367-4341-8e24-9edd07daa6ab",
    phash: "af0ed0f02f2ad495",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2239.png",
    uuid: "a618b978-4415-496b-9352-afc6dbc1f88e",
    phash: "d0692f9694696b96",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2240.png",
    uuid: "f0493613-c15b-4462-aef0-9f7c9d65dac8",
    phash: "acc3ff90b1c68392",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2241.png",
    uuid: "19cc66e4-e75b-45a6-96c5-127c9fb440aa",
    phash: "c4927b6c9693696c",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2242.png",
    uuid: "52adbc1e-d8bf-4bdb-8604-a6f26832e134",
    phash: "bb96d4696b1e3481",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2243.png",
    uuid: "64a0b6e4-797e-494f-8de7-d036eb19a11b",
    phash: "8ff0f00f20a01fdf",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2244.png",
    uuid: "be6f45b8-5dcf-405d-a85c-51031ccf5404",
    phash: "a065cf9a98cd659a",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2245.png",
    uuid: "8044f885-0abd-44bf-ad2e-be155c7dc788",
    phash: "b1cdcf326c91306d",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2246.png",
    uuid: "695e072f-f997-45cc-b43d-01bb556ec91b",
    phash: "9149e6b61d4961de",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2247.png",
    uuid: "28c0a1d8-e86b-4014-96ba-d6335866a9e5",
    phash: "cba0945f4ba0b45f",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2249.png",
    uuid: "6e3c1e64-2acd-46d2-bc08-e98f1c37afad",
    phash: "bbb1c44e3ab1b10e",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2250.png",
    uuid: "56723273-cb15-4601-a52f-533a4669dc3f",
    phash: "e7e0984fd0b66790",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2251.png",
    uuid: "8313a0e8-f2d8-4ada-9cf1-0da00d7a8acf",
    phash: "afcaf09297258f24",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2252.png",
    uuid: "d7ed2c73-61c0-443d-bfec-5d52f68a789b",
    phash: "d4e1eb9694192b36",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2253.png",
    uuid: "e6231ac9-88bd-4e5d-b431-e464bf858685",
    phash: "eda19293656d9296",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2255.png",
    uuid: "b642f514-b036-4891-9653-ebafdb5c489c",
    phash: "ba3794c8c13c3e95",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2256.png",
    uuid: "e6231ac9-88bd-4e5d-b431-e464bf858685",
    phash: "eda19293656d9296",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2257.png",
    uuid: "42cac9f1-8bb6-4622-8d56-2799491173b2",
    phash: "af49c0c59f368cc9",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2258.png",
    uuid: "5becadff-1ff9-4e02-8737-e1efb1534775",
    phash: "a9d2d62921d65e69",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2259.png",
    uuid: "c88f09d1-872d-492d-9586-ed43985c238b",
    phash: "ca48b7bb14b44b4b",
    type: "team",
    duplicate: true
  },
  {
    filename: "S15_2260.png",
    uuid: "0b3ac8ed-0f0a-4e3a-a48d-313d8ab6f3e3",
    phash: "b898c76768989667",
    type: "team",
    duplicate: false
  },
  {
    filename: "S15_2262.png",
    uuid: "90ea5631-15c0-48de-8bc9-b959eb89c873",
    phash: "ee80917f6e80817f",
    type: "team",
    duplicate: false
  },
  {
    filename: "S6_377.png",
    uuid: "f93953ce-14f0-4f68-aa06-7b22ff95626c",
    phash: "90906f67949c7b63",
    type: "team",
    duplicate: false
  },
  {
    filename: "S6_380.png",
    uuid: "6e3c1e64-2acd-46d2-bc08-e98f1c37afad",
    phash: "bbb1c44e3ab1b10e",
    type: "team",
    duplicate: true
  },
  {
    filename: "S6_393.png",
    uuid: "fc7552da-e4e4-4017-afcf-aae2ac8c5c46",
    phash: "eb7bd4ac81d1d10a",
    type: "team",
    duplicate: false
  },
  {
    filename: "S6_404.png",
    uuid: "9dce78e8-1ab8-4ae3-972d-623863f4a7ae",
    phash: "95856a7a95856a7a",
    type: "team",
    duplicate: true
  },
  {
    filename: "S6_405.png",
    uuid: "755e1ced-57ba-4bea-b919-825f77a6f586",
    phash: "eea4c1db965bc124",
    type: "team",
    duplicate: false
  },
  {
    filename: "S6_413.png",
    uuid: "f0493613-c15b-4462-aef0-9f7c9d65dac8",
    phash: "acc3ff90b1c68392",
    type: "team",
    duplicate: true
  },
  {
    filename: "S6_416.png",
    uuid: "0c12ab32-2dfb-49eb-aaa6-0ddc5ece0bf1",
    phash: "911b6ee971654696",
    type: "team",
    duplicate: true
  },
  {
    filename: "S6_417.png",
    uuid: "98119f91-ad4a-4ec4-87d5-2fa22f118ec9",
    phash: "baa685597aa68559",
    type: "team",
    duplicate: false
  },
  {
    filename: "S6_421.png",
    uuid: "93f22f2a-e3e0-400a-8cd6-23f9fb8e0607",
    phash: "e13496cb98c66c79",
    type: "team",
    duplicate: true
  },
  {
    filename: "S6_426.png",
    uuid: "59e5fd2a-a0b9-4f1b-8074-84b60bb65aa1",
    phash: "ff8680396f86a178",
    type: "team",
    duplicate: false
  },
  {
    filename: "S6_435.png",
    uuid: "f61c09fd-e7fa-4624-b8b7-b3d2fd648bb2",
    phash: "b366cc99cc333346",
    type: "team",
    duplicate: false
  },
  {
    filename: "S6_445.png",
    uuid: "17049e60-13c2-4d3f-a76a-d5d7d892ef0c",
    phash: "cbe764189893cd66",
    type: "team",
    duplicate: false
  },
  {
    filename: "S6_450.png",
    uuid: "31461fc1-c63c-4d2e-b9c4-c748ae29523b",
    phash: "bc30c7ce99c9c626",
    type: "team",
    duplicate: false
  },
  {
    filename: "S6_453.png",
    uuid: "c64e7203-7d8e-4b58-b51f-420e9a1ca212",
    phash: "ea6a95952b6ad095",
    type: "team",
    duplicate: false
  },
  {
    filename: "S6_457.png",
    uuid: "44b8a909-7890-45fe-8975-6d4e1b587d05",
    phash: "bb6ac4953b6a8495",
    type: "team",
    duplicate: true
  },
  {
    filename: "S6_462.png",
    uuid: "f74bcd9a-57e0-411f-8e07-6561c2b6de55",
    phash: "85867a6a793966c3",
    type: "team",
    duplicate: false
  },
  {
    filename: "S6_464.png",
    uuid: "00d61341-ea86-440f-bc85-979ec62bd5cc",
    phash: "efd4903b2dc94a16",
    type: "team",
    duplicate: false
  },
  {
    filename: "S6_465.png",
    uuid: "979528f9-2795-48ad-8a3d-e12a9eca7299",
    phash: "95946a6b95946b6a",
    type: "team",
    duplicate: false
  },
  {
    filename: "S6_468.png",
    uuid: "f0493613-c15b-4462-aef0-9f7c9d65dac8",
    phash: "acc3ff90b1c68392",
    type: "team",
    duplicate: true
  },
  {
    filename: "S6_471.png",
    uuid: "1d21606d-896f-453d-b928-7aedc62ca03e",
    phash: "ebcbd03435694ad2",
    type: "team",
    duplicate: false
  },
  {
    filename: "S6_474.png",
    uuid: "9dce78e8-1ab8-4ae3-972d-623863f4a7ae",
    phash: "95856a7a95856a7a",
    type: "team",
    duplicate: true
  },
  {
    filename: "S6_478.png",
    uuid: "98b667aa-aab3-4501-bc1f-656e89ad5041",
    phash: "ba2dc5d03a2fc5d0",
    type: "team",
    duplicate: true
  },
  {
    filename: "S6_479.png",
    uuid: "20f9fe33-6ce4-4ae8-a83c-a1b5c3df5fa8",
    phash: "d035a1d00fcf6c7a",
    type: "team",
    duplicate: false
  },
  {
    filename: "S6_480.png",
    uuid: "607a88d2-fdae-4b8d-9085-a878e9a01942",
    phash: "ac96c3498eb49973",
    type: "team",
    duplicate: true
  },
  {
    filename: "S6_481.png",
    uuid: "2911a068-a229-4c52-b8b6-d9c5b473f5f4",
    phash: "ea8685793a86c579",
    type: "team",
    duplicate: false
  },
  {
    filename: "S6_491.png",
    uuid: "f61c09fd-e7fa-4624-b8b7-b3d2fd648bb2",
    phash: "b366cc99cc333346",
    type: "team",
    duplicate: true
  },
  {
    filename: "S6_507.png",
    uuid: "9e10794c-2586-488a-8352-6eb1d91163ef",
    phash: "fae09685c27ac11f",
    type: "team",
    duplicate: false
  },
  {
    filename: "S6_512.png",
    uuid: "b4ebfa5f-10b5-47ac-8102-fe1d34eafeea",
    phash: "db9636c9613d3262",
    type: "team",
    duplicate: false
  },
  {
    filename: "S6_513.png",
    uuid: "943faba4-044e-43b0-82bb-77c32dbb4f0c",
    phash: "c5c53a3ac5d53a2a",
    type: "team",
    duplicate: true
  },
  {
    filename: "S6_519.png",
    uuid: "4b616520-b927-4833-8a9c-9621244fd854",
    phash: "c39e34e1cd38c32e",
    type: "team",
    duplicate: false
  },
  {
    filename: "S6_523.png",
    uuid: "17049e60-13c2-4d3f-a76a-d5d7d892ef0c",
    phash: "cbe764189893cd66",
    type: "team",
    duplicate: true
  },
  {
    filename: "S6_525.png",
    uuid: "100edac6-c309-486b-bddf-6c92895ec902",
    phash: "fe3881877e788187",
    type: "team",
    duplicate: true
  },
  {
    filename: "S6_530.png",
    uuid: "2a993be7-b629-41ac-b4e2-9265fcc6f0fb",
    phash: "bc364b4d32336c6c",
    type: "team",
    duplicate: false
  },
  {
    filename: "S6_534.png",
    uuid: "5becadff-1ff9-4e02-8737-e1efb1534775",
    phash: "a9d2d62921d65e69",
    type: "team",
    duplicate: true
  },
  {
    filename: "S6_537.png",
    uuid: "3ce0812e-9326-4e41-85e7-9d03e534cf65",
    phash: "ef9290696b923c69",
    type: "team",
    duplicate: true
  },
  {
    filename: "S6_538.png",
    uuid: "7bc75896-1ec8-46fa-8800-5f3553bd80c9",
    phash: "894c76b3895c76a3",
    type: "team",
    duplicate: true
  },
  {
    filename: "S6_549.png",
    uuid: "e744491f-9533-49f0-bec6-38479d7178f4",
    phash: "c5e5189e4e61399b",
    type: "team",
    duplicate: false
  },
  {
    filename: "S8_743.png",
    uuid: "3bdfc0a7-3f26-438f-b11a-593372dcbf24",
    phash: "d4d42b2bd4d42e2b",
    type: "team",
    duplicate: false
  },
  {
    filename: "S8_757.png",
    uuid: "c8180fa6-9aa3-45fd-be58-1d336a87076b",
    phash: "bf1cc0e13f1ec0e1",
    type: "team",
    duplicate: false
  },
  {
    filename: "S8_761.png",
    uuid: "44b8a909-7890-45fe-8975-6d4e1b587d05",
    phash: "bb6ac4953b6a8495",
    type: "team",
    duplicate: true
  },
  {
    filename: "S8_770.png",
    uuid: "b81e6e0d-4b69-49e8-971c-6e104c471210",
    phash: "ae27d1d03e27c1d8",
    type: "team",
    duplicate: true
  },
  {
    filename: "S8_776.png",
    uuid: "bcabf952-0c2f-4281-ae87-d109c2b73c18",
    phash: "93342dcb72dc3784",
    type: "team",
    duplicate: true
  },
  {
    filename: "S8_806.png",
    uuid: "1b594d40-1245-4ed4-8b11-a2d239876336",
    phash: "fa0b85f47a0b85f0",
    type: "team",
    duplicate: false
  },
  {
    filename: "S8_814.png",
    uuid: "0996e385-4b83-4ff3-a5c2-caee1c73baed",
    phash: "c23d3dc2c23d3dc2",
    type: "team",
    duplicate: false
  },
  {
    filename: "S8_822.png",
    uuid: "1b95443a-b94a-46d9-b35d-b32aaa1103b9",
    phash: "c09a3f65c49a7a65",
    type: "team",
    duplicate: false
  },
  {
    filename: "S8_840.png",
    uuid: "737fbb07-d71d-48af-8b6f-508919a66ea3",
    phash: "bee0c13f3ee09107",
    type: "team",
    duplicate: false
  },
  {
    filename: "S8_842.png",
    uuid: "78cd5bc0-d492-4d86-94e3-6c29823ef229",
    phash: "986667999a662979",
    type: "team",
    duplicate: false
  },
  {
    filename: "S8_844.png",
    uuid: "c8180fa6-9aa3-45fd-be58-1d336a87076b",
    phash: "bf1cc0e13f1ec0e1",
    type: "team",
    duplicate: true
  },
  {
    filename: "S8_858.png",
    uuid: "607a88d2-fdae-4b8d-9085-a878e9a01942",
    phash: "ac96c3498eb49973",
    type: "team",
    duplicate: true
  },
  {
    filename: "S8_865.png",
    uuid: "a003cc24-bad7-437d-a7a8-a3ed233fd906",
    phash: "8195fe680197fe68",
    type: "team",
    duplicate: true
  },
  {
    filename: "S8_867.png",
    uuid: "8c602998-6ad2-4cb4-b67e-ed9b567fc824",
    phash: "c11f3fc0c13f8ec1",
    type: "team",
    duplicate: true
  },
  {
    filename: "S8_870.png",
    uuid: "25d3c399-285b-42d3-a8c1-5997a5bf1291",
    phash: "b2b3894c66b33b4c",
    type: "team",
    duplicate: false
  },
  {
    filename: "S8_874.png",
    uuid: "df34366f-89cd-41db-841d-4c317e595c44",
    phash: "916b6e91956e6a91",
    type: "team",
    duplicate: false
  },
  {
    filename: "S8_876.png",
    uuid: "bd40b7cc-da7d-46db-ba86-934ad4325609",
    phash: "c4937b6c9493696c",
    type: "team",
    duplicate: false
  },
  {
    filename: "S8_877.png",
    uuid: "e8b7fc57-1dc7-4a42-96d1-80dd231f1607",
    phash: "93d36c266a497996",
    type: "team",
    duplicate: false
  },
  {
    filename: "S8_881.png",
    uuid: "eaf5e816-161d-4e73-949c-c5b774e5e931",
    phash: "ebcbd034352d4ad2",
    type: "team",
    duplicate: true
  },
  {
    filename: "S8_882.png",
    uuid: "47000815-620a-4069-834f-1d0f8aa7e4af",
    phash: "c141beba1141cfde",
    type: "team",
    duplicate: false
  },
  {
    filename: "S8_894.png",
    uuid: "4795fdab-d5c6-403a-bd7d-3ed547aa8449",
    phash: "ee81913e6ec181be",
    type: "team",
    duplicate: false
  },
  {
    filename: "S8_904.png",
    uuid: "ba74546c-69eb-4578-ab1a-8ff9aad4012c",
    phash: "cc9fb340449f9f60",
    type: "team",
    duplicate: false
  },
  {
    filename: "S8_906.png",
    uuid: "1cdbf57a-d8ad-4229-a23e-7b591ba1eac1",
    phash: "cb3f34c03ccc3333",
    type: "team",
    duplicate: false
  },
  {
    filename: "S8_911.png",
    uuid: "d5c7e285-3a9b-47fb-8abc-7ca0a9e29b04",
    phash: "ab0ed4f139954e4a",
    type: "team",
    duplicate: false
  },
  {
    filename: "S8_918.png",
    uuid: "800507f1-d0fc-424b-b203-8edb29bc41d1",
    phash: "bb4ac4b43a4bc5b4",
    type: "team",
    duplicate: false
  },
  {
    filename: "S8_932.png",
    uuid: "5becadff-1ff9-4e02-8737-e1efb1534775",
    phash: "a9d2d62921d65e69",
    type: "team",
    duplicate: true
  },
  {
    filename: "S8_933.png",
    uuid: "edbb69ff-026c-4159-9b11-dff5c3d81cc4",
    phash: "c49f6a993968b166",
    type: "team",
    duplicate: true
  },
  {
    filename: "S8_935.png",
    uuid: "4de7c3e8-3e4e-4432-b844-bd067fe67e67",
    phash: "eb4894b66b49c1b6",
    type: "team",
    duplicate: false
  },
  {
    filename: "S8_937.png",
    uuid: "f0493613-c15b-4462-aef0-9f7c9d65dac8",
    phash: "acc3ff90b1c68392",
    type: "team",
    duplicate: true
  },
  {
    filename: "S9_1002.png",
    uuid: "7bc75896-1ec8-46fa-8800-5f3553bd80c9",
    phash: "894c76b3895c76a3",
    type: "team",
    duplicate: true
  },
  {
    filename: "S9_1005.png",
    uuid: "bc512035-7b21-4719-b658-4f8757743d1e",
    phash: "802f7fd4802b3fd4",
    type: "team",
    duplicate: false
  },
  {
    filename: "S9_1018.png",
    uuid: "32d77ba0-5d21-4a46-b1d4-5303ea60e30a",
    phash: "ba99f9c3221cce64",
    type: "team",
    duplicate: true
  },
  {
    filename: "S9_1031.png",
    uuid: "ccfe5ea1-7973-42af-be9e-051bff0859ad",
    phash: "ff0f80e03d854e5a",
    type: "team",
    duplicate: false
  },
  {
    filename: "S9_1048.png",
    uuid: "0629aacd-3efb-4cb2-bd11-18931f29c4cc",
    phash: "84ac7b5384ac7b53",
    type: "team",
    duplicate: true
  },
  {
    filename: "S9_1054.png",
    uuid: "a003cc24-bad7-437d-a7a8-a3ed233fd906",
    phash: "8195fe680197fe68",
    type: "team",
    duplicate: true
  },
  {
    filename: "S9_1065.png",
    uuid: "5ca66305-45b2-4156-b8f5-fe40699fee4d",
    phash: "e3b1c6c3b80ecd29",
    type: "team",
    duplicate: false
  },
  {
    filename: "S9_1070.png",
    uuid: "72f9812a-4102-4cc6-b48d-459ec4abdc09",
    phash: "faa4e1d09725ce58",
    type: "team",
    duplicate: true
  },
  {
    filename: "S9_1075.png",
    uuid: "f4259467-5221-4e52-8bbe-b9114057c200",
    phash: "ec4bc3b5932c3cc2",
    type: "team",
    duplicate: true
  },
  {
    filename: "S9_1087.png",
    uuid: "c0be0c04-ebc6-446a-a2c6-f2c836d80a28",
    phash: "83d8fc2501dabe65",
    type: "team",
    duplicate: false
  },
  {
    filename: "S9_1112.png",
    uuid: "48546b0c-62a2-428a-88b3-bab3fc1743d3",
    phash: "d0e46f1b90e46e1b",
    type: "team",
    duplicate: false
  },
  {
    filename: "S9_1115.png",
    uuid: "73ac24fb-858d-4812-9545-c27a99f7033f",
    phash: "c7c33c3c61c3963c",
    type: "team",
    duplicate: true
  },
  {
    filename: "S9_1124.png",
    uuid: "6d1679ee-06c7-4afb-a4bd-d91d46a688ac",
    phash: "dc3723ccd4330bcc",
    type: "team",
    duplicate: false
  },
  {
    filename: "S9_1145.png",
    uuid: "de29686e-b4d7-4597-94d2-560037c22116",
    phash: "d3792c8693696c96",
    type: "team",
    duplicate: true
  },
  {
    filename: "S9_1151.png",
    uuid: "aed86d0d-87cd-4340-ae64-f8517622ad87",
    phash: "ce66319966669966",
    type: "team",
    duplicate: true
  },
  {
    filename: "S9_1153.png",
    uuid: "3ce0812e-9326-4e41-85e7-9d03e534cf65",
    phash: "ef9290696b923c69",
    type: "team",
    duplicate: true
  },
  {
    filename: "S9_1163.png",
    uuid: "226a9858-6b21-4f0c-b092-e6346d1d51a2",
    phash: "b830c7ce99c9c6c6",
    type: "team",
    duplicate: false
  },
  {
    filename: "S9_946.png",
    uuid: "60c5afc8-466d-4c33-a1b4-345598556f75",
    phash: "bf3bc0c4033b3b91",
    type: "team",
    duplicate: false
  },
  {
    filename: "S9_957.png",
    uuid: "e87eb010-20cb-4129-bcf1-cb2401dde0f1",
    phash: "c50f9af0600f9ff0",
    type: "team",
    duplicate: false
  },
  {
    filename: "S9_960.png",
    uuid: "607a88d2-fdae-4b8d-9085-a878e9a01942",
    phash: "ac96c3498eb49973",
    type: "team",
    duplicate: true
  },
  {
    filename: "S9_968.png",
    uuid: "b3cd9115-dd30-42ef-8f7f-8aebfe17f311",
    phash: "bbe1c71ed819d091",
    type: "team",
    duplicate: false
  },
  {
    filename: "S9_981.png",
    uuid: "5ca66305-45b2-4156-b8f5-fe40699fee4d",
    phash: "e3b1c6c3b80ecd29",
    type: "team",
    duplicate: true
  },
  {
    filename: "S9_983.png",
    uuid: "fb7fbca2-148f-4af6-94cd-67c758d5c916",
    phash: "a1e5de83d5588974",
    type: "team",
    duplicate: true
  },
  {
    filename: "S9_988.png",
    uuid: "fb7acffd-996b-4109-8197-58e4ffaeed03",
    phash: "d2cf6d30309f0ed2",
    type: "team",
    duplicate: true
  },
  {
    filename: "S9_991.png",
    uuid: "1b594d40-1245-4ed4-8b11-a2d239876336",
    phash: "fa0b85f47a0b85f0",
    type: "team",
    duplicate: true
  },
  {
    filename: "S9_997.png",
    uuid: "ccfe5ea1-7973-42af-be9e-051bff0859ad",
    phash: "ff0f80e03d854e5a",
    type: "team",
    duplicate: true
  },
  {
    filename: "bilar99.png",
    uuid: "9683d032-0450-4496-b0c5-7260765cde88",
    phash: "be98c067c7c3193c",
    type: "team",
    duplicate: false
  },
  {
    filename: "broman.png",
    uuid: "03c4e8f0-d07c-4299-9cf5-962072984391",
    phash: "e36b9c90b44d4b33",
    type: "team",
    duplicate: false
  },
  {
    filename: "decens.png",
    uuid: "cfd5d72f-55db-4658-887d-14c645167c68",
    phash: "c1c33e7cc1c374a5",
    type: "team",
    duplicate: false
  },
  {
    filename: "erillisverkot-team.jpeg",
    uuid: "eab03f48-d289-4e4d-818b-43c5faeee978",
    phash: "856678677998599a",
    type: "team",
    duplicate: false
  },
  {
    filename: "etteplan.png",
    uuid: "19b87e34-d473-441e-b951-3ab765b91eb5",
    phash: "d0d407837a5adf25",
    type: "team",
    duplicate: false
  },
  {
    filename: "fraidei.png",
    uuid: "95d4a57b-d7da-4cd0-88d8-f56bf91a7131",
    phash: "eb0f94f06b0f90f0",
    type: "team",
    duplicate: false
  },
  {
    filename: "gim-robotics.png",
    uuid: "e90a6630-5bbf-4c76-aeb3-4457c5010400",
    phash: "f80707fdbc80701f",
    type: "team",
    duplicate: false
  },
  {
    filename: "hsl_team.png",
    uuid: "aae58ee7-e6d1-498f-b622-1359909de154",
    phash: "c27b2c2330dec3bc",
    type: "team",
    duplicate: false
  },
  {
    filename: "istekki.png",
    uuid: "4fc447d4-5143-45fb-a027-dc07d64938ef",
    phash: "ba92c56d3a92946d",
    type: "team",
    duplicate: false
  },
  {
    filename: "joki_ict.jpg",
    uuid: "990ac1e2-95a7-4a51-a084-f068acce51e1",
    phash: "ec7893876c5c91a3",
    type: "team",
    duplicate: false
  },
  {
    filename: "neliot-liikkuu-team.jpeg",
    uuid: "2de83617-8dc3-4224-8c12-ad7bf51febe9",
    phash: "a533ce86938c93cb",
    type: "team",
    duplicate: false
  },
  {
    filename: "nologo.png",
    uuid: "206d4d27-75d5-45bf-8fe5-09c9af12fc31",
    phash: "c163141e6bd36e65",
    type: "team",
    duplicate: false
  },
  {
    filename: "oulu.jpg",
    uuid: "5d6d8e5f-8e78-4daf-b71b-c68f54910a94",
    phash: "b165cfc6861c9c1b",
    type: "team",
    duplicate: false
  },
  {
    filename: "pp-ruoka.jpg",
    uuid: "e3ce1330-4817-481e-a31f-8b0417fed830",
    phash: "c5c61e69699b30c7",
    type: "team",
    duplicate: false
  },
  {
    filename: "probis_solutions_oy_logo.jpeg",
    uuid: "0af313eb-1d4c-4a9e-98b6-618f87a52224",
    phash: "afe6c08d916b921d",
    type: "team",
    duplicate: false
  },
  {
    filename: "produal.png",
    uuid: "6e647281-6016-4437-8937-e9d7fc736c95",
    phash: "db9c6cc3923cc949",
    type: "team",
    duplicate: false
  },
  {
    filename: "ropo.png",
    uuid: "1af2ff05-de2e-4ca5-8cd1-d8b226710a95",
    phash: "d1e02e1f95e0699e",
    type: "team",
    duplicate: false
  },
  {
    filename: "sanoma.png",
    uuid: "eea2b707-8b4d-4f62-a467-680176816b35",
    phash: "c0c13f3ec0c13f3e",
    type: "team",
    duplicate: false
  },
  {
    filename: "serviceform.jpg",
    uuid: "862f48cc-17f5-479c-8253-87f501ff9ac9",
    phash: "cdb0364f5bd88427",
    type: "team",
    duplicate: false
  },
  {
    filename: "sevendos_team.jpg",
    uuid: "8151e010-0442-48f4-9cf5-b73aca74ead2",
    phash: "faa0c585f21c2d76",
    type: "team",
    duplicate: false
  },
  {
    filename: "sweco.jpg",
    uuid: "52be4c48-91d5-463b-941a-9f2766d6625a",
    phash: "eaca85357acac135",
    type: "team",
    duplicate: false
  },
  {
    filename: "talokaivo.png",
    uuid: "91a4f6b6-bb09-4b10-98ff-e82437212698",
    phash: "bf9cc0622f9dd062",
    type: "team",
    duplicate: false
  },
  {
    filename: "tietoevry_team.png",
    uuid: "7b71d364-3b14-4787-9c15-93f744771d69",
    phash: "bb38f0e18e86ccd8",
    type: "team",
    duplicate: false
  },
  {
    filename: "S10_1192.png",
    uuid: "0505a57d-c0cd-4bff-a4b2-816acc209b7e",
    phash: "a4659e9ad13bc6c4",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S10_1220.png",
    uuid: "321817ab-65a1-4bc2-8c6f-596c371ca73c",
    phash: "ef3a90c52f3ad0c4",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S10_1312.png",
    uuid: "c6862d88-f28f-40e7-85ca-487768bf52fb",
    phash: "e0d93f6695996066",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S10_1324.png",
    uuid: "b6bdbe35-2cc2-4b7f-8c66-6efb1ceafde6",
    phash: "ab39d4c26a3995c6",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1421.png",
    uuid: "8ca7f8c0-41bd-471c-9262-2b5a2817feda",
    phash: "eee291196ae68599",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1426.png",
    uuid: "d9ece2fd-ef9b-4aee-9b15-85cb1187c375",
    phash: "b8bcc3439cfe3281",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1428.png",
    uuid: "5f2ee4c9-d44e-43f9-bbb8-fa58d0a78cb6",
    phash: "fa33c49883c59e4e",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1431.png",
    uuid: "72563b48-d184-48da-911b-83342863cfa7",
    phash: "863979c6863979c6",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1434.png",
    uuid: "073b022a-9c2f-46e2-9d4a-de5280a7e6f6",
    phash: "caa5955a2aa5c57a",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1439.png",
    uuid: "69a4186b-f921-44fd-bcd6-2a32fed1a896",
    phash: "ea1e95e16b1e94c1",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1441.png",
    uuid: "efc6ae05-83bc-4ebc-9af4-c2690e8614bb",
    phash: "80763fc9c53a7887",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1444.png",
    uuid: "d9c52585-7e0c-4cf2-8e98-e38c8cbf942f",
    phash: "efa9d0562ea8c42b",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1447.png",
    uuid: "a2a1d170-26ad-4262-9086-6cb0150d477d",
    phash: "c5c13a3ed4c1c93e",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1449.png",
    uuid: "bdf51120-11a4-446a-ac0b-c13b030c09a5",
    phash: "af26d0d12f2ed0d1",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1455.png",
    uuid: "0629aacd-3efb-4cb2-bd11-18931f29c4cc",
    phash: "84ac7b5384ac7b53",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1457.png",
    uuid: "fc37179b-fed3-48e0-b781-9fb1b1d3c3b5",
    phash: "ae5ad1a52e5ac585",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1463.png",
    uuid: "feb51c6f-9ee1-4884-ad98-7d930822f638",
    phash: "eb9684697b968469",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1464.png",
    uuid: "e2383392-6157-423e-ac8c-f053c6d0f99f",
    phash: "bf1ec0e03f1ec0e1",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1466.png",
    uuid: "3cd948ff-eb97-4c2f-a4c1-45c3668d56ea",
    phash: "f885d35a857c46a5",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1471.png",
    uuid: "5d4f471d-072b-4782-9fda-67afea0201d0",
    phash: "a7f8c802257da7a6",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1481.png",
    uuid: "f419578b-7790-48e7-803c-3422cfb6d422",
    phash: "c0f23a0fc5f27a0d",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1483.png",
    uuid: "d40eead9-c8a8-4c9b-918c-edf6f2248669",
    phash: "bb91e42493d9ce31",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1486.png",
    uuid: "0c12ab32-2dfb-49eb-aaa6-0ddc5ece0bf1",
    phash: "911b6ee971654696",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1487.png",
    uuid: "22999c57-da3d-47f6-bc38-2bb765d6ca87",
    phash: "fb6a84957b6a8095",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1490.png",
    uuid: "f3dba86b-aa04-4edd-96e1-05cf226a4513",
    phash: "efd0902b6fd0902f",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1499.png",
    uuid: "24ade179-2270-417b-9280-331053a9361e",
    phash: "af13b0ccd8b6c632",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1501.png",
    uuid: "e1542039-66c8-40d7-bc24-924f22cf3b56",
    phash: "9f38e0871f78e407",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1506.png",
    uuid: "9ce859cd-334d-44ff-90b7-abe53758beb3",
    phash: "eb7c94832b6cd093",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1516.png",
    uuid: "c1431064-e68b-4843-b107-7df5dced16d9",
    phash: "bfc3c0343fcbc034",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1519.png",
    uuid: "8c602998-6ad2-4cb4-b67e-ed9b567fc824",
    phash: "c11f3fc0c13f8ec1",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1520.png",
    uuid: "1b85dc58-2639-455a-a5b0-fafbd73b4085",
    phash: "875cf883077cfc84",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1522.png",
    uuid: "51c0e709-3d0b-473b-b51f-c5a66a3d739d",
    phash: "b864c19bce323a6d",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1525.png",
    uuid: "aed86d0d-87cd-4340-ae64-f8517622ad87",
    phash: "ce66319966669966",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1535.png",
    uuid: "77542b31-11ce-4af6-9717-573484ca288f",
    phash: "8f85f0780685f97a",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1546.png",
    uuid: "f3261682-192d-4312-9df3-48531ed52446",
    phash: "ea2c95c36a3c95c3",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1552.png",
    uuid: "b81e6e0d-4b69-49e8-971c-6e104c471210",
    phash: "ae27d1d03e27c1d8",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1554.png",
    uuid: "8cd530b3-457e-4c39-b9a0-036a2b3f4382",
    phash: "ef13f0a4e792864a",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1556.png",
    uuid: "8e236e5e-9556-40df-a1e0-5471acfb6275",
    phash: "d2633d9cc3639239",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1558.png",
    uuid: "268848a3-55f1-4d71-b139-1a5d8b421c09",
    phash: "b365cf1a9093c66c",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1560.png",
    uuid: "32d77ba0-5d21-4a46-b1d4-5303ea60e30a",
    phash: "ba99f9c3221cce64",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1573.png",
    uuid: "3c46e3ed-2554-41f1-adcb-9bb4c4320f25",
    phash: "eb82941ecb699c36",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1577.png",
    uuid: "8557bbff-dd61-4e7b-a0bc-85ed233ca834",
    phash: "d06f2f98d0670f98",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1580.png",
    uuid: "8bb04861-5199-4dbf-9c00-598913f3a20a",
    phash: "ece4cb9c3033e346",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1584.png",
    uuid: "0b90a387-a09d-434b-aae9-4539113a7631",
    phash: "e6e2991de66618cc",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1588.png",
    uuid: "d9b314cb-38b7-4757-ae5b-45ceb0f1e96d",
    phash: "bbb1c44e4e04b9b3",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1589.png",
    uuid: "722df919-923a-4816-94ef-cc5c7f47d943",
    phash: "a3f0d88dd91e0d72",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1593.png",
    uuid: "f4259467-5221-4e52-8bbe-b9114057c200",
    phash: "ec4bc3b5932c3cc2",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1595.png",
    uuid: "58cd7603-beee-4f0c-8bfe-89a8d817c1bf",
    phash: "adc9d13632c96d34",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1596.png",
    uuid: "090d3a69-e4cd-425e-8efb-70743d24e362",
    phash: "af1dd0626b9d9462",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1597.png",
    uuid: "100edac6-c309-486b-bddf-6c92895ec902",
    phash: "fe3881877e788187",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1606.png",
    uuid: "98b667aa-aab3-4501-bc1f-656e89ad5041",
    phash: "ba2dc5d03a2fc5d0",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1608.png",
    uuid: "9eb6b947-6278-44c6-8a06-93b4287400be",
    phash: "91d03e2f0b6de594",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1611.png",
    uuid: "d01bd01d-e4d0-46c7-8d98-19d9b1e4f46c",
    phash: "e83c87cb9a326ccc",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1612.png",
    uuid: "b4470138-a3d7-4432-9097-3dd9c655f51c",
    phash: "91b16ec666293979",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1613.png",
    uuid: "fb7acffd-996b-4109-8197-58e4ffaeed03",
    phash: "d2cf6d30309f0ed2",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1622.png",
    uuid: "f3261682-192d-4312-9df3-48531ed52446",
    phash: "ea2c95c36a3c95c3",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1626.png",
    uuid: "87aecbb4-34ad-43bd-aa61-618d6dbf1e6b",
    phash: "c4b23b4d3b3264cd",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1628.png",
    uuid: "72f9812a-4102-4cc6-b48d-459ec4abdc09",
    phash: "faa4e1d09725ce58",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1631.png",
    uuid: "5746bd8c-776a-445b-bad2-9b5673a4f633",
    phash: "bac7cc38c5389387",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1636.png",
    uuid: "080d6b3f-0bfd-491d-a5b4-66aff791910e",
    phash: "81affe7005afc950",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1637.png",
    uuid: "8b2d54f2-99b9-4eb3-b96c-f036ebd4e028",
    phash: "83e0fc1f03c0bc3f",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1639.png",
    uuid: "53a25ea1-02f2-467f-9aca-5b10e1890647",
    phash: "e9e39a9cc03cc36a",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1645.png",
    uuid: "da5f295d-3269-45d6-b941-a297533b25e5",
    phash: "c3323cc93bc6c5b1",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1647.png",
    uuid: "96e3ebd7-342a-4119-aec8-f9b86b1b556a",
    phash: "d58aaa319d4f64f0",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S11_1648.png",
    uuid: "d617f46b-03de-4eaf-a586-abdaf591d124",
    phash: "bd94c239976e91e0",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S12_1659.png",
    uuid: "8bccac2b-2e9c-4fbf-a772-de4978c64bc6",
    phash: "bf66c0993f6680d1",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S12_1667.png",
    uuid: "b54e7643-8a8d-41a4-8813-739bd31fdc90",
    phash: "be80c13f3ec0c13f",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S12_1678.png",
    uuid: "4db8cd31-47bd-486e-8673-caf969b3fd83",
    phash: "895e73215e93c55c",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S12_1691.png",
    uuid: "29f8f5ce-3c5e-4bd5-a98c-e5aec7c7a69f",
    phash: "af84d072668c9bf2",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S12_1702.png",
    uuid: "42400bc5-5a31-41cb-b89a-bdc3da1bdf81",
    phash: "d4cc6b7395ccc036",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S12_1707.png",
    uuid: "e51c7ed4-f7ea-4dbd-ae20-673e0c0b2062",
    phash: "9b21250fcb97353c",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S12_1713.png",
    uuid: "a003cc24-bad7-437d-a7a8-a3ed233fd906",
    phash: "8195fe680197fe68",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S12_1725.png",
    uuid: "a34bfd37-4367-4341-8e24-9edd07daa6ab",
    phash: "af0ed0f02f2ad495",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S12_1738.png",
    uuid: "4e6e921e-62af-43fc-b31b-280b097b1ea0",
    phash: "eba0945e6ba1945e",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S12_1765.png",
    uuid: "ab005ab0-d942-465a-856f-69beecc00e6f",
    phash: "a8f5921add0ac7c6",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S12_1779.png",
    uuid: "6d8398ef-d9f9-4e16-bf4f-8cd51b373463",
    phash: "b061cf96c7cc6493",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S12_1781.png",
    uuid: "412137f3-009b-4971-afdd-736129e13533",
    phash: "942b6af0a58bd62d",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S12_1794.png",
    uuid: "5becadff-1ff9-4e02-8737-e1efb1534775",
    phash: "a9d2d62921d65e69",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S12_1795.png",
    uuid: "41ddefa5-7fd2-4c8e-9058-0db3b28a8c6b",
    phash: "bad9c5223ad9e522",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S13_1828.png",
    uuid: "eaf5e816-161d-4e73-949c-c5b774e5e931",
    phash: "ebcbd034352d4ad2",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S13_1834.png",
    uuid: "3377eb80-eac4-4748-abd2-3bd0925034ee",
    phash: "c7986d4f3036199b",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S13_1845.png",
    uuid: "b35740a8-7822-42bb-bc17-d748814391cd",
    phash: "e87897876c789187",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S13_1854.png",
    uuid: "dac95e2b-5aa5-4bca-9697-7c0131596e39",
    phash: "ea8e85e1d032c76b",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S13_1870.png",
    uuid: "d9c7de21-14e9-439a-bcd6-6e4639a4a26b",
    phash: "a4d9bb6671897461",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S13_1877.png",
    uuid: "89cb58f7-cd19-4adf-9986-86e6e646508b",
    phash: "aa90d57f3b80407f",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S13_1889.png",
    uuid: "589bb3aa-11b1-4dbe-94c0-d79a6a853c35",
    phash: "9866673939c69639",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S13_1892.png",
    uuid: "68580b64-96d1-46f0-ae5a-1952385e3da2",
    phash: "e61f9960629f9d60",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S13_1893.png",
    uuid: "22ca7774-c340-439b-b698-67be94c9a4fe",
    phash: "838f18b04fc6731f",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S13_1896.png",
    uuid: "acdfcef4-ca03-4cd9-a7ec-518c0c5ac19c",
    phash: "e4349bdb34644ab6",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S13_1902.png",
    uuid: "8876949d-8601-4bce-8746-be6f220cbcda",
    phash: "c5d948c43b764e1b",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S13_1903.png",
    uuid: "5d15f09c-de50-4d36-99b0-78625aa662ed",
    phash: "d54a6a95946a6b95",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S13_1913.png",
    uuid: "102b0450-57c3-4f13-8a19-da2cc6c784df",
    phash: "d0bd2f42d43d2bc2",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S13_1920.png",
    uuid: "8789cab6-a8d4-40f0-a8ae-6cc9b97e9031",
    phash: "e4399fc663e13438",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S13_1921.png",
    uuid: "730d6841-8292-4db9-a016-8ed0f4c4dc60",
    phash: "936d6c92c56c3a1b",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S13_1922.png",
    uuid: "226ce6d7-fa25-484f-996b-7713fe12c302",
    phash: "be4f81b094c5ef0a",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S13_1925.png",
    uuid: "4f2f9b1f-f4c2-4f61-994d-b59ccfc821a3",
    phash: "fa5d85a03a5fc5a0",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S13_1935.png",
    uuid: "73ac24fb-858d-4812-9545-c27a99f7033f",
    phash: "c7c33c3c61c3963c",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S13_1942.png",
    uuid: "1e2f21d5-31e9-47ec-98d9-8218ab385ed4",
    phash: "b4e6cf9893493c32",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S13_1946.png",
    uuid: "ce65289f-cc09-4cc6-b9cc-0cd4e8c96049",
    phash: "9b3030cdcdb3936c",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S13_1956.png",
    uuid: "6e3c1e64-2acd-46d2-bc08-e98f1c37afad",
    phash: "bbb1c44e3ab1b10e",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S13_1962.png",
    uuid: "9dce78e8-1ab8-4ae3-972d-623863f4a7ae",
    phash: "95856a7a95856a7a",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S13_1968.png",
    uuid: "659dc22d-2274-4d0d-84b0-a5a334cb081c",
    phash: "eac4953b6ac4833b",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_1970.png",
    uuid: "bc437b5b-e9ef-41aa-952c-7bd819b1fc45",
    phash: "ba12c5e55a12b5ad",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_1975.png",
    uuid: "5fd5b452-7e34-41d3-b830-5d47bda5b0ae",
    phash: "9e39646633c95966",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_1978.png",
    uuid: "2d6239c1-1712-4650-91b5-f71156600197",
    phash: "ba96c4693a96cc69",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_1979.png",
    uuid: "43299f67-d055-4d0a-a695-a94b8c953a60",
    phash: "af84d06b6f94906b",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_1982.png",
    uuid: "67652417-d49a-4ee8-834f-a7b6edfa95c2",
    phash: "ea7895856a7a9585",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_1987.png",
    uuid: "1c40e8f7-0e49-4629-896f-59e0ca0bdc9f",
    phash: "fa1a85a19a86c977",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_1993.png",
    uuid: "35db049b-d936-4125-ba9d-fed14ae96a7d",
    phash: "9893674d616cceb2",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_1996.png",
    uuid: "307cc1f3-e0fc-4442-b464-1545538c11ac",
    phash: "8fe0f00f2ff0906b",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_1997.png",
    uuid: "607a88d2-fdae-4b8d-9085-a878e9a01942",
    phash: "ac96c3498eb49973",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2000.png",
    uuid: "fa92c472-5d66-4e31-8c1a-0e29e75dc16d",
    phash: "a346dcb9234695b9",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2001.png",
    uuid: "44d3c96c-2876-4acd-a396-207c5470d837",
    phash: "96396b8695397a46",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2004.png",
    uuid: "28c3ee22-921a-4d96-a69d-42681b403348",
    phash: "d48c2b33d4cc2f33",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2016.png",
    uuid: "4bd22331-8ce0-47c6-bca7-75bb9a6c4990",
    phash: "956a7a916935863e",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2017.png",
    uuid: "fe233a0e-a9aa-4d7f-93be-c556640e9ca0",
    phash: "9de66219bde6021d",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2026.png",
    uuid: "484b536e-e1ae-4b6c-be4e-bfbe48d23fd1",
    phash: "d4783b87c4787a85",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2030.png",
    uuid: "8313a0e8-f2d8-4ada-9cf1-0da00d7a8acf",
    phash: "afcaf09297258f24",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2034.png",
    uuid: "ff5e4995-7eb1-4ddc-91e1-5a136b94bcf7",
    phash: "c11c6c6396b06f1f",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2042.png",
    uuid: "47af53c2-0527-4733-ab68-82216586d744",
    phash: "b8c99336cd31c533",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2044.png",
    uuid: "62e220ba-3b05-4f62-8fb3-3980343f5ad8",
    phash: "846f1a3a5f317945",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2045.png",
    uuid: "977842aa-2c59-4ccc-a93d-9c14599cbd17",
    phash: "9a3ce5c31a3dec82",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2051.png",
    uuid: "08b35d5d-34f6-42d1-8d6b-c75183c3a55c",
    phash: "944a3fbd6394e462",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2052.png",
    uuid: "3d44c077-0f29-40f8-9c21-14727b34286a",
    phash: "db7c489737936122",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2053.png",
    uuid: "4c90102c-022e-4b51-9e56-883caabf63dc",
    phash: "999a66613266cd9b",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2058.png",
    uuid: "08bc0a40-e548-40eb-8db7-9c8563975238",
    phash: "cf9838e7641c3333",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2059.png",
    uuid: "f0493613-c15b-4462-aef0-9f7c9d65dac8",
    phash: "acc3ff90b1c68392",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2060.png",
    uuid: "94e8b53d-aa60-4367-af3b-aa5c34fcfb6e",
    phash: "c46b6ea1319233cf",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2062.png",
    uuid: "e9103da7-5782-4562-a71f-7fbe7ec6b05c",
    phash: "beb4c44ac94f9391",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2064.png",
    uuid: "c4066dd5-59b8-452d-8698-e5ead8c2211e",
    phash: "af95976ac295604b",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2066.png",
    uuid: "551cd109-7451-41a5-9603-2582c4e45c78",
    phash: "c90f3e70672536d2",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2068.png",
    uuid: "cf0ff900-b0fc-48dc-aa47-b4d3efb40b23",
    phash: "9f38e0c11d3eea61",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2069.png",
    uuid: "b2db7dd8-9bb1-4f52-bfd8-b2db7f1b1ea4",
    phash: "bc78c30761c99eb4",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2071.png",
    uuid: "bea9c4a5-3a80-4ff0-8462-ce017d6994d7",
    phash: "ef66f0989b0d0d43",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2073.png",
    uuid: "375e8094-3129-44c4-82a5-2bb52c82f982",
    phash: "e492d7695bc63c30",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2075.png",
    uuid: "89b613ee-0afb-4a7e-99cd-47bea684f162",
    phash: "eb91946a6b95946a",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2077.png",
    uuid: "2120df31-9c5e-4fed-91a5-9ab79d90c65c",
    phash: "e135ca9a3949b666",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2079.png",
    uuid: "d6a8510f-0d6c-4bb4-bcfa-ecc50fdc990e",
    phash: "a282df7d2082d75d",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2080.png",
    uuid: "e3b6094c-aea6-4b32-9020-cdcd875a6b93",
    phash: "f993866c3993866c",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2081.png",
    uuid: "1f9d89df-02ef-4577-8906-d95230c4d24d",
    phash: "e6c69338ccc73619",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2082.png",
    uuid: "90d1c4f8-aced-40b0-8ccf-ba1eba4a2f32",
    phash: "a766cc999991316e",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2083.png",
    uuid: "80dad1eb-614a-41f6-82ee-01c05f9807d7",
    phash: "ea0dd5722a0dc772",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2085.png",
    uuid: "299889cd-64f5-42d3-ab18-c61b0ff32150",
    phash: "eeb091464ab83fc5",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2086.png",
    uuid: "fb7fbca2-148f-4af6-94cd-67c758d5c916",
    phash: "a1e5de83d5588974",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2090.png",
    uuid: "f5b1e2d9-51f2-4e71-9804-288f8e4dede1",
    phash: "838df860039fff60",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2096.png",
    uuid: "f16d15aa-7a12-42a8-a5a9-715363e3b619",
    phash: "91496eb499cfc139",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2101.png",
    uuid: "ece61de6-4e65-4e0b-b3af-de6a0fff3f23",
    phash: "ef8790386e8791d8",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2102.png",
    uuid: "3c365ce3-efea-4a8a-a72e-154032fb5fab",
    phash: "abc0d43e2fc1d03e",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2105.png",
    uuid: "e97272f4-346f-4dc2-9276-03ab912f296f",
    phash: "fef881833a7ec481",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2107.png",
    uuid: "df8275a9-7169-4973-94d0-0b54b998505f",
    phash: "ee6cb993e48c2661",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2109.png",
    uuid: "6abafc5d-2ff5-477a-9050-c3a1aa57c1bf",
    phash: "e9c1863e9039b6c7",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2112.png",
    uuid: "aed86d0d-87cd-4340-ae64-f8517622ad87",
    phash: "ce66319966669966",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S14_2117.png",
    uuid: "bcabf952-0c2f-4281-ae87-d109c2b73c18",
    phash: "93342dcb72dc3784",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2123.png",
    uuid: "a308b715-0cd9-45ce-b227-04e8108974af",
    phash: "91e64f196ce63139",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2126.png",
    uuid: "d7ed2c73-61c0-443d-bfec-5d52f68a789b",
    phash: "d4e1eb9694192b36",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2127.png",
    uuid: "5c5217d2-88c4-4baf-9432-853c4ab1ba2c",
    phash: "a6b49ec3c3699c34",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2128.png",
    uuid: "1c5fe460-f24b-4d28-bb82-e115910f1dd8",
    phash: "adc6d219cf643833",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2129.png",
    uuid: "1f6cc605-7078-4200-a14d-f19d40781185",
    phash: "bbb19a4ec43a3991",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2130.png",
    uuid: "3c02803f-0e44-408d-b5d0-1b4b8430eff1",
    phash: "be93c16c2e93946c",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2133.png",
    uuid: "00b607a0-ab3c-498b-9be8-d088bef964f3",
    phash: "ef3290856f72948d",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2134.png",
    uuid: "d194e640-eea9-4a16-8b00-d95cbbb36456",
    phash: "b9b1c2e3198ee46c",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2137.png",
    uuid: "b82e2860-18ac-4495-97f0-5588a340b1bb",
    phash: "f100aacf3930e5cf",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2138.png",
    uuid: "8e5fefc3-d69d-4a70-96a6-96ba875a6626",
    phash: "957b6a84953b6ac4",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2139.png",
    uuid: "77baf26a-fb12-4692-9a79-d03ae729dfd7",
    phash: "bf0ec0e13d846a6b",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2141.png",
    uuid: "6ceb5103-9a07-415b-8d0e-57b1c8c724df",
    phash: "b8e3259d07cb5887",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2142.png",
    uuid: "9a5adebe-c11e-4da3-a3e5-d11eaff309fe",
    phash: "bf3bc0c42a021f3f",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2144.png",
    uuid: "f1dbcea4-e6c9-46b4-bef4-3cb43fd1fdc6",
    phash: "929a6de5961b33a4",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2145.png",
    uuid: "dc4d73fe-fbd9-4dac-a8a3-2f1583442d1a",
    phash: "84b71fca781d6169",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2146.png",
    uuid: "8e37476a-5745-4599-b4b0-f3c2d663ac30",
    phash: "af2bd0d40f3b2b84",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2147.png",
    uuid: "e01a3690-7e33-44e0-a4e0-1f68ec2e74e1",
    phash: "891b3764ce19b167",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2152.png",
    uuid: "3ce0812e-9326-4e41-85e7-9d03e534cf65",
    phash: "ef9290696b923c69",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2154.png",
    uuid: "53951f68-316b-4384-a333-012e3d54ff56",
    phash: "e9c1963e6961629e",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2155.png",
    uuid: "809a606f-c3a3-4ea3-979a-2ed3a390836d",
    phash: "ab2fd4c02b3fd4c0",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2158.png",
    uuid: "87c857a1-7944-4b97-9110-222e371b7dca",
    phash: "9ff0e00f03729e9c",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2159.png",
    uuid: "d70ba916-4a3e-4b4e-a61c-b75e54f0187d",
    phash: "98586f9790786d87",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2160.png",
    uuid: "39b90c9e-0e1c-433e-b069-d62f23c4fb20",
    phash: "afc0d02d2fc0d13f",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2163.png",
    uuid: "6d8398ef-d9f9-4e16-bf4f-8cd51b373463",
    phash: "b061cf96c7cc6493",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2165.png",
    uuid: "fef43e55-6037-4ea8-a53b-f297b08e1306",
    phash: "e0901f6fe0901f6f",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2166.png",
    uuid: "be6f45b8-5dcf-405d-a85c-51031ccf5404",
    phash: "a065cf9a98cd659a",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2172.png",
    uuid: "4d3fc49b-44b1-42d0-8e3e-4247245e8db5",
    phash: "b98cc6731a0e61ed",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2175.png",
    uuid: "6ad5bac6-ffbc-4f08-96ad-2b82b19e424a",
    phash: "b191cf679118d663",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2179.png",
    uuid: "dbc61014-4edd-40fc-912e-b53f2ab2e5b8",
    phash: "93b46cc9973472ca",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2180.png",
    uuid: "81578235-9330-44f2-9cc5-395c13f3fd5a",
    phash: "af2790d86f2790d8",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2183.png",
    uuid: "4e03f3ba-7d0a-4a51-a309-8fe79a8f63e3",
    phash: "cc3133cecc39cc93",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2184.png",
    uuid: "5353875a-821d-425a-b5c5-ec6810ae6e95",
    phash: "c7cf3d3c26643892",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2186.png",
    uuid: "9ea63270-fef2-4a0a-a975-c1f2c2886937",
    phash: "bb87c4683f97c068",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2187.png",
    uuid: "b4bf00cb-29f6-4219-b034-98ff8b996931",
    phash: "aee1f195e05b850e",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2188.png",
    uuid: "adcff0a3-1c4f-4e96-b41c-2c116e6c1abe",
    phash: "afe0f88785c2528f",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2191.png",
    uuid: "fa83cb7d-653f-440e-bdb3-b0253c1a8fa1",
    phash: "be95c1683e97c168",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2192.png",
    uuid: "f40a0c15-0fba-482a-a8c9-5bac8fa14b41",
    phash: "9661673859ce19e3",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2196.png",
    uuid: "ea2e6135-b753-4305-9b43-ffe45a789631",
    phash: "c1663e99856359b6",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2197.png",
    uuid: "e9ea834c-6420-4d78-9bf8-09db6a095233",
    phash: "fae79470839a489b",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2198.png",
    uuid: "6c793691-dab1-4ffb-acfc-4f99947fe730",
    phash: "fe1c80e37f1c84e1",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2199.png",
    uuid: "4e7aafd0-be26-40fc-8c15-35db6490b3ab",
    phash: "ee38b0cfb132c631",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2204.png",
    uuid: "a63c0b9f-1745-4fd5-98d3-07d39534af56",
    phash: "b173ce8c3173c68c",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2206.png",
    uuid: "dc942d90-f1b7-431d-a10b-93e9823e27aa",
    phash: "95846a7b95846a7b",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2207.png",
    uuid: "293d8e74-2a11-483c-8e54-cf3cf7f27c83",
    phash: "c1611e943e9e6acb",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2209.png",
    uuid: "a0b6e63d-3aa0-42a1-957c-c05c4901dd39",
    phash: "aec8d1373ec8c135",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2211.png",
    uuid: "540a32a1-2263-4636-9b00-925c73cec8ef",
    phash: "bb8d8463c71eb0a5",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2215.png",
    uuid: "44b8a909-7890-45fe-8975-6d4e1b587d05",
    phash: "bb6ac4953b6a8495",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2216.png",
    uuid: "19cc66e4-e75b-45a6-96c5-127c9fb440aa",
    phash: "c4927b6c9693696c",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2221.png",
    uuid: "99fbe245-a9d9-4704-937f-aa86f8ef1e15",
    phash: "af93a52cb4b332c8",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2222.png",
    uuid: "befe0bdf-78e9-4e9b-9568-207fcfdffbac",
    phash: "bc2dc3d23c2dc1d2",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2224.png",
    uuid: "87ad501c-8157-4568-8a85-bc65d6074960",
    phash: "cdcc3232ccc79b98",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2227.png",
    uuid: "a52ad0ab-b7fd-4b28-92bb-0b5835440f98",
    phash: "ab1fd4e02b1f96c0",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2228.png",
    uuid: "86cc3b8f-115a-4cf4-9d36-92f2956bc15a",
    phash: "edcc9232c94de634",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2230.png",
    uuid: "28c0a1d8-e86b-4014-96ba-d6335866a9e5",
    phash: "cba0945f4ba0b45f",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2233.png",
    uuid: "08e23f3b-00dd-45b2-8a47-925ae224eba4",
    phash: "fb9884667b998466",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2235.png",
    uuid: "42cac9f1-8bb6-4622-8d56-2799491173b2",
    phash: "af49c0c59f368cc9",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2236.png",
    uuid: "b44be7e3-af88-464f-a81b-d772b6a7219d",
    phash: "d02e2fd1d02e3fc1",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2239.png",
    uuid: "a618b978-4415-496b-9352-afc6dbc1f88e",
    phash: "d0692f9694696b96",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2242.png",
    uuid: "52adbc1e-d8bf-4bdb-8604-a6f26832e134",
    phash: "bb96d4696b1e3481",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2243.png",
    uuid: "64a0b6e4-797e-494f-8de7-d036eb19a11b",
    phash: "8ff0f00f20a01fdf",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2245.png",
    uuid: "8044f885-0abd-44bf-ad2e-be155c7dc788",
    phash: "b1cdcf326c91306d",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2246.png",
    uuid: "695e072f-f997-45cc-b43d-01bb556ec91b",
    phash: "9149e6b61d4961de",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2250.png",
    uuid: "56723273-cb15-4601-a52f-533a4669dc3f",
    phash: "e7e0984fd0b66790",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2253.png",
    uuid: "e6231ac9-88bd-4e5d-b431-e464bf858685",
    phash: "eda19293656d9296",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2255.png",
    uuid: "b642f514-b036-4891-9653-ebafdb5c489c",
    phash: "ba3794c8c13c3e95",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2257.png",
    uuid: "42cac9f1-8bb6-4622-8d56-2799491173b2",
    phash: "af49c0c59f368cc9",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2259.png",
    uuid: "c88f09d1-872d-492d-9586-ed43985c238b",
    phash: "ca48b7bb14b44b4b",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S15_2260.png",
    uuid: "0b3ac8ed-0f0a-4e3a-a48d-313d8ab6f3e3",
    phash: "b898c76768989667",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S8_870.png",
    uuid: "25d3c399-285b-42d3-a8c1-5997a5bf1291",
    phash: "b2b3894c66b33b4c",
    type: "organization",
    duplicate: true
  },
  {
    filename: "S9_1145.png",
    uuid: "de29686e-b4d7-4597-94d2-560037c22116",
    phash: "d3792c8693696c96",
    type: "organization",
    duplicate: true
  },
  {
    filename: "bilar99.png",
    uuid: "9683d032-0450-4496-b0c5-7260765cde88",
    phash: "be98c067c7c3193c",
    type: "organization",
    duplicate: true
  },
  {
    filename: "broman.png",
    uuid: "03c4e8f0-d07c-4299-9cf5-962072984391",
    phash: "e36b9c90b44d4b33",
    type: "organization",
    duplicate: true
  },
  {
    filename: "decens.png",
    uuid: "cfd5d72f-55db-4658-887d-14c645167c68",
    phash: "c1c33e7cc1c374a5",
    type: "organization",
    duplicate: true
  },
  {
    filename: "erillisverkot-org.png",
    uuid: "62edac1e-5b50-4018-b0f4-f3991f994476",
    phash: "d0c52f3ad0c52f3a",
    type: "organization",
    duplicate: false
  },
  {
    filename: "etteplan.png",
    uuid: "19b87e34-d473-441e-b951-3ab765b91eb5",
    phash: "d0d407837a5adf25",
    type: "organization",
    duplicate: true
  },
  {
    filename: "fraidei.png",
    uuid: "95d4a57b-d7da-4cd0-88d8-f56bf91a7131",
    phash: "eb0f94f06b0f90f0",
    type: "organization",
    duplicate: true
  },
  {
    filename: "gim-robotics.png",
    uuid: "e90a6630-5bbf-4c76-aeb3-4457c5010400",
    phash: "f80707fdbc80701f",
    type: "organization",
    duplicate: true
  },
  {
    filename: "hsl_org.png",
    uuid: "90454da3-0a6d-48ef-b7ae-224843067a3c",
    phash: "943e6b6994966b68",
    type: "organization",
    duplicate: false
  },
  {
    filename: "istekki.png",
    uuid: "4fc447d4-5143-45fb-a027-dc07d64938ef",
    phash: "ba92c56d3a92946d",
    type: "organization",
    duplicate: true
  },
  {
    filename: "joki_ict.jpg",
    uuid: "990ac1e2-95a7-4a51-a084-f068acce51e1",
    phash: "ec7893876c5c91a3",
    type: "organization",
    duplicate: true
  },
  {
    filename: "neliot-liikkuu.jpeg",
    uuid: "e2dbf24b-d8df-4ef7-8905-d675d16cf55d",
    phash: "c3c43439dac6e761",
    type: "organization",
    duplicate: false
  },
  {
    filename: "nologo.png",
    uuid: "206d4d27-75d5-45bf-8fe5-09c9af12fc31",
    phash: "c163141e6bd36e65",
    type: "organization",
    duplicate: true
  },
  {
    filename: "oulu.jpg",
    uuid: "5d6d8e5f-8e78-4daf-b71b-c68f54910a94",
    phash: "b165cfc6861c9c1b",
    type: "organization",
    duplicate: true
  },
  {
    filename: "pp-ruoka.jpg",
    uuid: "e3ce1330-4817-481e-a31f-8b0417fed830",
    phash: "c5c61e69699b30c7",
    type: "organization",
    duplicate: true
  },
  {
    filename: "probis_solutions_oy_logo.jpeg",
    uuid: "0af313eb-1d4c-4a9e-98b6-618f87a52224",
    phash: "afe6c08d916b921d",
    type: "organization",
    duplicate: true
  },
  {
    filename: "produal.png",
    uuid: "6e647281-6016-4437-8937-e9d7fc736c95",
    phash: "db9c6cc3923cc949",
    type: "organization",
    duplicate: true
  },
  {
    filename: "ropo.png",
    uuid: "1af2ff05-de2e-4ca5-8cd1-d8b226710a95",
    phash: "d1e02e1f95e0699e",
    type: "organization",
    duplicate: true
  },
  {
    filename: "sanoma.png",
    uuid: "eea2b707-8b4d-4f62-a467-680176816b35",
    phash: "c0c13f3ec0c13f3e",
    type: "organization",
    duplicate: true
  },
  {
    filename: "serviceform.jpg",
    uuid: "862f48cc-17f5-479c-8253-87f501ff9ac9",
    phash: "cdb0364f5bd88427",
    type: "organization",
    duplicate: true
  },
  {
    filename: "sevendos_org.png",
    uuid: "1a0ca269-13df-4bd5-ae9c-5a9d8e35052d",
    phash: "ef2b90c46f3b90c4",
    type: "organization",
    duplicate: false
  },
  {
    filename: "sweco.jpg",
    uuid: "52be4c48-91d5-463b-941a-9f2766d6625a",
    phash: "eaca85357acac135",
    type: "organization",
    duplicate: true
  },
  {
    filename: "talokaivo.png",
    uuid: "91a4f6b6-bb09-4b10-98ff-e82437212698",
    phash: "bf9cc0622f9dd062",
    type: "organization",
    duplicate: true
  },
  {
    filename: "tietoevry.png",
    uuid: "e91e0538-d35e-490c-99f0-9c00ec99a910",
    phash: "eb2194da6b2594da",
    type: "organization",
    duplicate: false
  }
];

export async function up(knex: Knex): Promise<void> {
  const mappings = EMBEDDED_MAPPINGS;

  // Create lookup maps (filename → UUID)
  const teamMappings = new Map<string, string>();
  const orgMappings = new Map<string, string>();

  mappings.forEach((m) => {
    if (m.type === "team") {
      teamMappings.set(m.filename, m.uuid);
    } else if (m.type === "organization") {
      orgMappings.set(m.filename, m.uuid);
    }
  });

  console.warn(
    `Loaded ${teamMappings.size} team mappings and ${orgMappings.size} organization mappings`
  );

  // Update Teams table
  const teams = await knex("Teams").select("id", "team_logo");
  let teamsUpdated = 0;
  let teamsSkipped = 0;

  for (const team of teams) {
    const uuid = teamMappings.get(team.team_logo);
    if (uuid) {
      await knex("Teams").where("id", team.id).update({ team_logo: uuid });
      teamsUpdated++;
    } else {
      console.warn(
        `No UUID mapping found for team logo: ${team.team_logo} (team ID: ${team.id})`
      );
      teamsSkipped++;
    }
  }

  console.warn(
    `Updated ${teamsUpdated} team logos, ${teamsSkipped} skipped (no mapping found)`
  );

  // Update Organizations table
  const orgs = await knex("Organizations").select("id", "logo");
  let orgsUpdated = 0;
  let orgsSkipped = 0;

  for (const org of orgs) {
    const uuid = orgMappings.get(org.logo);
    if (uuid) {
      await knex("Organizations").where("id", org.id).update({ logo: uuid });
      orgsUpdated++;
    } else {
      console.warn(
        `No UUID mapping found for org logo: ${org.logo} (org ID: ${org.id})`
      );
      orgsSkipped++;
    }
  }

  console.warn(
    `Updated ${orgsUpdated} organization logos, ${orgsSkipped} skipped (no mapping found)`
  );
}

export async function down(_knex: Knex): Promise<void> {
  // Reverse migration would require storing original filenames
  // This is complex and may not be necessary
  // For now, we'll throw an error to prevent accidental rollback
  throw new Error(
    "Down migration not implemented - requires original filename storage. " +
      "If rollback is needed, restore from database backup."
  );
}
