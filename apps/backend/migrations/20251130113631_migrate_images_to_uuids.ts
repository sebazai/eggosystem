import type { Knex } from "knex";

interface ImageMapping {
  filename: string;
  phash: string;
  type: "team" | "organization";
}

// Embedded image mappings from production image service
// Generated from image-mappings.json - contains 791 mappings
// Uses phash instead of UUID since UUIDs differ across environments but phash is consistent
const EMBEDDED_MAPPINGS: ImageMapping[] = [
  {
    filename: "S10_1177.png",
    phash: "ee84913b6ec4913b",
    type: "team"
  },
  {
    filename: "S10_1181.png",
    phash: "bb6ac4953b6a8495",
    type: "team"
  },
  {
    filename: "S10_1186.png",
    phash: "be97c1683e878178",
    type: "team"
  },
  {
    filename: "S10_1188.png",
    phash: "ae27d1d03e27c1d8",
    type: "team"
  },
  {
    filename: "S10_1191.png",
    phash: "e4349bdb34644ab6",
    type: "team"
  },
  {
    filename: "S10_1192.png",
    phash: "a4659e9ad13bc6c4",
    type: "team"
  },
  {
    filename: "S10_1195.png",
    phash: "93dc64e73032c3cd",
    type: "team"
  },
  {
    filename: "S10_1199.png",
    phash: "e09f1f60e09f1f60",
    type: "team"
  },
  {
    filename: "S10_1203.png",
    phash: "bcbe6171f204c768",
    type: "team"
  },
  {
    filename: "S10_1210.png",
    phash: "af26d0d12f2ed0d1",
    type: "team"
  },
  {
    filename: "S10_1212.png",
    phash: "e3b0ce4b916c2b93",
    type: "team"
  },
  {
    filename: "S10_1219.png",
    phash: "afcaf09297258f24",
    type: "team"
  },
  {
    filename: "S10_1220.png",
    phash: "ef3a90c52f3ad0c4",
    type: "team"
  },
  {
    filename: "S10_1221.png",
    phash: "bf66c0993f6680d1",
    type: "team"
  },
  {
    filename: "S10_1223.png",
    phash: "d4b72b48c635c393",
    type: "team"
  },
  {
    filename: "S10_1224.png",
    phash: "bbb1c44e3ab1b10e",
    type: "team"
  },
  {
    filename: "S10_1225.png",
    phash: "eb82941ecb699c36",
    type: "team"
  },
  {
    filename: "S10_1230.png",
    phash: "a1e5de83d5588974",
    type: "team"
  },
  {
    filename: "S10_1232.png",
    phash: "cba0945f4ba0b45f",
    type: "team"
  },
  {
    filename: "S10_1234.png",
    phash: "838f18b04fc6731f",
    type: "team"
  },
  {
    filename: "S10_1237.png",
    phash: "bbb1c44e4e04b9b3",
    type: "team"
  },
  {
    filename: "S10_1238.png",
    phash: "ed8882475ea9a976",
    type: "team"
  },
  {
    filename: "S10_1240.png",
    phash: "ef9290696b923c69",
    type: "team"
  },
  {
    filename: "S10_1243.png",
    phash: "eb82941ecb699c36",
    type: "team"
  },
  {
    filename: "S10_1261.png",
    phash: "e75a38a1c75e38a1",
    type: "team"
  },
  {
    filename: "S10_1270.png",
    phash: "bfa5604a864a9db5",
    type: "team"
  },
  {
    filename: "S10_1273.png",
    phash: "894c76b3895c76a3",
    type: "team"
  },
  {
    filename: "S10_1278.png",
    phash: "e13496cb98c66c79",
    type: "team"
  },
  {
    filename: "S10_1280.png",
    phash: "ec4bc3b5932c3cc2",
    type: "team"
  },
  {
    filename: "S10_1284.png",
    phash: "c6e13b1ec5c19a36",
    type: "team"
  },
  {
    filename: "S10_1292.png",
    phash: "ef13f0a4e792864a",
    type: "team"
  },
  {
    filename: "S10_1312.png",
    phash: "e0d93f6695996066",
    type: "team"
  },
  {
    filename: "S10_1315.png",
    phash: "afcaf09297258f24",
    type: "team"
  },
  {
    filename: "S10_1316.png",
    phash: "ece4cb9c3033e346",
    type: "team"
  },
  {
    filename: "S10_1320.png",
    phash: "d2cf6d30309f0ed2",
    type: "team"
  },
  {
    filename: "S10_1322.png",
    phash: "93342dcb72dc3784",
    type: "team"
  },
  {
    filename: "S10_1324.png",
    phash: "ab39d4c26a3995c6",
    type: "team"
  },
  {
    filename: "S10_1326.png",
    phash: "c49f6a993968b166",
    type: "team"
  },
  {
    filename: "S10_1330.png",
    phash: "8f85f0780685f97a",
    type: "team"
  },
  {
    filename: "S10_1331.png",
    phash: "96396b8695397a46",
    type: "team"
  },
  {
    filename: "S10_1332.png",
    phash: "edcc9232c94de634",
    type: "team"
  },
  {
    filename: "S10_1334.png",
    phash: "96396b8695397a46",
    type: "team"
  },
  {
    filename: "S10_1337.png",
    phash: "b333cccc99913ba2",
    type: "team"
  },
  {
    filename: "S10_1338.png",
    phash: "9e39646633c95966",
    type: "team"
  },
  {
    filename: "S10_1339.png",
    phash: "94636b9c3d9c6172",
    type: "team"
  },
  {
    filename: "S10_1343.png",
    phash: "edcc9232c94de634",
    type: "team"
  },
  {
    filename: "S10_1347.png",
    phash: "abd0d02f2fd0d127",
    type: "team"
  },
  {
    filename: "S10_1349.png",
    phash: "b8c99336cd31c533",
    type: "team"
  },
  {
    filename: "S10_1350.png",
    phash: "eb63949c6a63919c",
    type: "team"
  },
  {
    filename: "S10_1353.png",
    phash: "80763fc9c53a7887",
    type: "team"
  },
  {
    filename: "S10_1358.png",
    phash: "d1262ed9d1262bd9",
    type: "team"
  },
  {
    filename: "S10_1363.png",
    phash: "be7ac1853c3bc2c8",
    type: "team"
  },
  {
    filename: "S10_1365.png",
    phash: "c5c53a3ac5d53a2a",
    type: "team"
  },
  {
    filename: "S10_1368.png",
    phash: "bc9dc36272352d98",
    type: "team"
  },
  {
    filename: "S10_1371.png",
    phash: "bbc63139c439c4c7",
    type: "team"
  },
  {
    filename: "S10_1372.png",
    phash: "c0f23a0fc5f27a0d",
    type: "team"
  },
  {
    filename: "S10_1373.png",
    phash: "bf66c0993f6680d1",
    type: "team"
  },
  {
    filename: "S10_1376.png",
    phash: "bb91e42493d9ce31",
    type: "team"
  },
  {
    filename: "S10_1379.png",
    phash: "be7ac1853c3bc2c8",
    type: "team"
  },
  {
    filename: "S10_1383.png",
    phash: "faa4e1d09725ce58",
    type: "team"
  },
  {
    filename: "S10_1387.png",
    phash: "edc486b31b4ec469",
    type: "team"
  },
  {
    filename: "S10_1392.png",
    phash: "9264c5490bcfce4f",
    type: "team"
  },
  {
    filename: "S10_1393.png",
    phash: "d3792c8693696c96",
    type: "team"
  },
  {
    filename: "S10_1394.png",
    phash: "bd87c2189f65c8b2",
    type: "team"
  },
  {
    filename: "S10_1396.png",
    phash: "ba12c5e55a12b5ad",
    type: "team"
  },
  {
    filename: "S10_1397.png",
    phash: "93342dcb72dc3784",
    type: "team"
  },
  {
    filename: "S10_1398.png",
    phash: "c5c53a3ac5d53a2a",
    type: "team"
  },
  {
    filename: "S10_1399.png",
    phash: "c0f23a0fc5f27a0d",
    type: "team"
  },
  {
    filename: "S10_1400.png",
    phash: "bc96c3693c96c64a",
    type: "team"
  },
  {
    filename: "S10_1402.png",
    phash: "ef9290696b923c69",
    type: "team"
  },
  {
    filename: "S10_1404.png",
    phash: "b4cb8b32cb2c98e3",
    type: "team"
  },
  {
    filename: "S10_1405.png",
    phash: "bad9c5223ad9e522",
    type: "team"
  },
  {
    filename: "S11_1421.png",
    phash: "eee291196ae68599",
    type: "team"
  },
  {
    filename: "S11_1423.png",
    phash: "ea3496c3a5d3496c",
    type: "team"
  },
  {
    filename: "S11_1426.png",
    phash: "b8bcc3439cfe3281",
    type: "team"
  },
  {
    filename: "S11_1427.png",
    phash: "8fe0f00f2ff0906b",
    type: "team"
  },
  {
    filename: "S11_1428.png",
    phash: "fa33c49883c59e4e",
    type: "team"
  },
  {
    filename: "S11_1431.png",
    phash: "863979c6863979c6",
    type: "team"
  },
  {
    filename: "S11_1434.png",
    phash: "caa5955a2aa5c57a",
    type: "team"
  },
  {
    filename: "S11_1439.png",
    phash: "ea1e95e16b1e94c1",
    type: "team"
  },
  {
    filename: "S11_1440.png",
    phash: "956a7a916935863e",
    type: "team"
  },
  {
    filename: "S11_1441.png",
    phash: "80763fc9c53a7887",
    type: "team"
  },
  {
    filename: "S11_1443.png",
    phash: "a346dcb9234695b9",
    type: "team"
  },
  {
    filename: "S11_1444.png",
    phash: "efa9d0562ea8c42b",
    type: "team"
  },
  {
    filename: "S11_1447.png",
    phash: "c5c13a3ed4c1c93e",
    type: "team"
  },
  {
    filename: "S11_1449.png",
    phash: "af26d0d12f2ed0d1",
    type: "team"
  },
  {
    filename: "S11_1455.png",
    phash: "84ac7b5384ac7b53",
    type: "team"
  },
  {
    filename: "S11_1457.png",
    phash: "ae5ad1a52e5ac585",
    type: "team"
  },
  {
    filename: "S11_1460.png",
    phash: "db7c489737936122",
    type: "team"
  },
  {
    filename: "S11_1462.png",
    phash: "8195fe680197fe68",
    type: "team"
  },
  {
    filename: "S11_1463.png",
    phash: "eb9684697b968469",
    type: "team"
  },
  {
    filename: "S11_1464.png",
    phash: "bf1ec0e03f1ec0e1",
    type: "team"
  },
  {
    filename: "S11_1466.png",
    phash: "f885d35a857c46a5",
    type: "team"
  },
  {
    filename: "S11_1471.png",
    phash: "a7f8c802257da7a6",
    type: "team"
  },
  {
    filename: "S11_1477.png",
    phash: "911b4ee43b1b2ce6",
    type: "team"
  },
  {
    filename: "S11_1481.png",
    phash: "c0f23a0fc5f27a0d",
    type: "team"
  },
  {
    filename: "S11_1482.png",
    phash: "bb6ac4953b6a8495",
    type: "team"
  },
  {
    filename: "S11_1483.png",
    phash: "bb91e42493d9ce31",
    type: "team"
  },
  {
    filename: "S11_1485.png",
    phash: "c5c53a3ac5d53a2a",
    type: "team"
  },
  {
    filename: "S11_1486.png",
    phash: "911b6ee971654696",
    type: "team"
  },
  {
    filename: "S11_1487.png",
    phash: "fb6a84957b6a8095",
    type: "team"
  },
  {
    filename: "S11_1490.png",
    phash: "efd0902b6fd0902f",
    type: "team"
  },
  {
    filename: "S11_1494.png",
    phash: "af26d0d12f2ed0d1",
    type: "team"
  },
  {
    filename: "S11_1496.png",
    phash: "9893674d616cceb2",
    type: "team"
  },
  {
    filename: "S11_1498.png",
    phash: "9661673859ce19e3",
    type: "team"
  },
  {
    filename: "S11_1499.png",
    phash: "af13b0ccd8b6c632",
    type: "team"
  },
  {
    filename: "S11_1501.png",
    phash: "9f38e0871f78e407",
    type: "team"
  },
  {
    filename: "S11_1506.png",
    phash: "eb7c94832b6cd093",
    type: "team"
  },
  {
    filename: "S11_1510.png",
    phash: "aec0c13f3ec0c13f",
    type: "team"
  },
  {
    filename: "S11_1511.png",
    phash: "863979c6863979c6",
    type: "team"
  },
  {
    filename: "S11_1512.png",
    phash: "d2633d9cc3639239",
    type: "team"
  },
  {
    filename: "S11_1516.png",
    phash: "bfc3c0343fcbc034",
    type: "team"
  },
  {
    filename: "S11_1519.png",
    phash: "c11f3fc0c13f8ec1",
    type: "team"
  },
  {
    filename: "S11_1520.png",
    phash: "875cf883077cfc84",
    type: "team"
  },
  {
    filename: "S11_1522.png",
    phash: "b864c19bce323a6d",
    type: "team"
  },
  {
    filename: "S11_1525.png",
    phash: "ce66319966669966",
    type: "team"
  },
  {
    filename: "S11_1529.png",
    phash: "ef9290696b923c69",
    type: "team"
  },
  {
    filename: "S11_1532.png",
    phash: "db7c489737936122",
    type: "team"
  },
  {
    filename: "S11_1534.png",
    phash: "db7c489737936122",
    type: "team"
  },
  {
    filename: "S11_1535.png",
    phash: "8f85f0780685f97a",
    type: "team"
  },
  {
    filename: "S11_1539.png",
    phash: "ca48b7bb14b44b4b",
    type: "team"
  },
  {
    filename: "S11_1544.png",
    phash: "a9d2d62921d65e69",
    type: "team"
  },
  {
    filename: "S11_1546.png",
    phash: "ea2c95c36a3c95c3",
    type: "team"
  },
  {
    filename: "S11_1548.png",
    phash: "ebcbd034352d4ad2",
    type: "team"
  },
  {
    filename: "S11_1552.png",
    phash: "ae27d1d03e27c1d8",
    type: "team"
  },
  {
    filename: "S11_1554.png",
    phash: "ef13f0a4e792864a",
    type: "team"
  },
  {
    filename: "S11_1556.png",
    phash: "d2633d9cc3639239",
    type: "team"
  },
  {
    filename: "S11_1558.png",
    phash: "b365cf1a9093c66c",
    type: "team"
  },
  {
    filename: "S11_1559.png",
    phash: "b4e6cf9893493c32",
    type: "team"
  },
  {
    filename: "S11_1560.png",
    phash: "ba99f9c3221cce64",
    type: "team"
  },
  {
    filename: "S11_1562.png",
    phash: "ee84913b6ec4913b",
    type: "team"
  },
  {
    filename: "S11_1565.png",
    phash: "ef9290696b923c69",
    type: "team"
  },
  {
    filename: "S11_1566.png",
    phash: "fef881833a7ec481",
    type: "team"
  },
  {
    filename: "S11_1568.png",
    phash: "96396b8695397a46",
    type: "team"
  },
  {
    filename: "S11_1572.png",
    phash: "ee6cb993e48c2661",
    type: "team"
  },
  {
    filename: "S11_1573.png",
    phash: "eb82941ecb699c36",
    type: "team"
  },
  {
    filename: "S11_1577.png",
    phash: "d06f2f98d0670f98",
    type: "team"
  },
  {
    filename: "S11_1580.png",
    phash: "ece4cb9c3033e346",
    type: "team"
  },
  {
    filename: "S11_1584.png",
    phash: "e6e2991de66618cc",
    type: "team"
  },
  {
    filename: "S11_1588.png",
    phash: "bbb1c44e4e04b9b3",
    type: "team"
  },
  {
    filename: "S11_1589.png",
    phash: "a3f0d88dd91e0d72",
    type: "team"
  },
  {
    filename: "S11_1591.png",
    phash: "ebcbd034352d4ad2",
    type: "team"
  },
  {
    filename: "S11_1593.png",
    phash: "ec4bc3b5932c3cc2",
    type: "team"
  },
  {
    filename: "S11_1595.png",
    phash: "adc9d13632c96d34",
    type: "team"
  },
  {
    filename: "S11_1596.png",
    phash: "af1dd0626b9d9462",
    type: "team"
  },
  {
    filename: "S11_1597.png",
    phash: "fe3881877e788187",
    type: "team"
  },
  {
    filename: "S11_1598.png",
    phash: "bfa5604a864a9db5",
    type: "team"
  },
  {
    filename: "S11_1601.png",
    phash: "b8c99336cd31c533",
    type: "team"
  },
  {
    filename: "S11_1604.png",
    phash: "e4349bdb34644ab6",
    type: "team"
  },
  {
    filename: "S11_1606.png",
    phash: "ba2dc5d03a2fc5d0",
    type: "team"
  },
  {
    filename: "S11_1607.png",
    phash: "bbb1c44e3ab1b10e",
    type: "team"
  },
  {
    filename: "S11_1608.png",
    phash: "91d03e2f0b6de594",
    type: "team"
  },
  {
    filename: "S11_1609.png",
    phash: "afcaf09297258f24",
    type: "team"
  },
  {
    filename: "S11_1611.png",
    phash: "e83c87cb9a326ccc",
    type: "team"
  },
  {
    filename: "S11_1612.png",
    phash: "91b16ec666293979",
    type: "team"
  },
  {
    filename: "S11_1613.png",
    phash: "d2cf6d30309f0ed2",
    type: "team"
  },
  {
    filename: "S11_1619.png",
    phash: "be4f81b094c5ef0a",
    type: "team"
  },
  {
    filename: "S11_1620.png",
    phash: "d4b72b48c635c393",
    type: "team"
  },
  {
    filename: "S11_1621.png",
    phash: "b8c99336cd31c533",
    type: "team"
  },
  {
    filename: "S11_1622.png",
    phash: "ea2c95c36a3c95c3",
    type: "team"
  },
  {
    filename: "S11_1626.png",
    phash: "c4b23b4d3b3264cd",
    type: "team"
  },
  {
    filename: "S11_1628.png",
    phash: "faa4e1d09725ce58",
    type: "team"
  },
  {
    filename: "S11_1629.png",
    phash: "8f85f0780685f97a",
    type: "team"
  },
  {
    filename: "S11_1630.png",
    phash: "d2cf6d30309f0ed2",
    type: "team"
  },
  {
    filename: "S11_1631.png",
    phash: "bac7cc38c5389387",
    type: "team"
  },
  {
    filename: "S11_1636.png",
    phash: "81affe7005afc950",
    type: "team"
  },
  {
    filename: "S11_1637.png",
    phash: "83e0fc1f03c0bc3f",
    type: "team"
  },
  {
    filename: "S11_1639.png",
    phash: "e9e39a9cc03cc36a",
    type: "team"
  },
  {
    filename: "S11_1642.png",
    phash: "9e39646633c95966",
    type: "team"
  },
  {
    filename: "S11_1645.png",
    phash: "c3323cc93bc6c5b1",
    type: "team"
  },
  {
    filename: "S11_1647.png",
    phash: "d58aaa319d4f64f0",
    type: "team"
  },
  {
    filename: "S11_1648.png",
    phash: "bd94c239976e91e0",
    type: "team"
  },
  {
    filename: "S11_1649.png",
    phash: "afcaf09297258f24",
    type: "team"
  },
  {
    filename: "S12_1656.png",
    phash: "afcaf09297258f24",
    type: "team"
  },
  {
    filename: "S12_1659.png",
    phash: "bf66c0993f6680d1",
    type: "team"
  },
  {
    filename: "S12_1667.png",
    phash: "be80c13f3ec0c13f",
    type: "team"
  },
  {
    filename: "S12_1670.png",
    phash: "956a7a916935863e",
    type: "team"
  },
  {
    filename: "S12_1673.png",
    phash: "bbb1c44e3ab1b10e",
    type: "team"
  },
  {
    filename: "S12_1678.png",
    phash: "895e73215e93c55c",
    type: "team"
  },
  {
    filename: "S12_1685.png",
    phash: "e135ca9a3949b666",
    type: "team"
  },
  {
    filename: "S12_1691.png",
    phash: "af84d072668c9bf2",
    type: "team"
  },
  {
    filename: "S12_1694.png",
    phash: "fef881833a7ec481",
    type: "team"
  },
  {
    filename: "S12_1702.png",
    phash: "d4cc6b7395ccc036",
    type: "team"
  },
  {
    filename: "S12_1703.png",
    phash: "bbb1c44e3ab1b10e",
    type: "team"
  },
  {
    filename: "S12_1707.png",
    phash: "9b21250fcb97353c",
    type: "team"
  },
  {
    filename: "S12_1713.png",
    phash: "8195fe680197fe68",
    type: "team"
  },
  {
    filename: "S12_1725.png",
    phash: "af0ed0f02f2ad495",
    type: "team"
  },
  {
    filename: "S12_1731.png",
    phash: "9661673859ce19e3",
    type: "team"
  },
  {
    filename: "S12_1738.png",
    phash: "eba0945e6ba1945e",
    type: "team"
  },
  {
    filename: "S12_1743.png",
    phash: "bf66c0993f6680d1",
    type: "team"
  },
  {
    filename: "S12_1744.png",
    phash: "91376ec891376ec8",
    type: "team"
  },
  {
    filename: "S12_1746.png",
    phash: "ba99f9c3221cce64",
    type: "team"
  },
  {
    filename: "S12_1748.png",
    phash: "eb9684697b968469",
    type: "team"
  },
  {
    filename: "S12_1750.png",
    phash: "e492d7695bc63c30",
    type: "team"
  },
  {
    filename: "S12_1757.png",
    phash: "e135ca9a3949b666",
    type: "team"
  },
  {
    filename: "S12_1765.png",
    phash: "a8f5921add0ac7c6",
    type: "team"
  },
  {
    filename: "S12_1769.png",
    phash: "edcc9232c94de634",
    type: "team"
  },
  {
    filename: "S12_1771.png",
    phash: "9c613a2b739c6574",
    type: "team"
  },
  {
    filename: "S12_1773.png",
    phash: "cba0945f4ba0b45f",
    type: "team"
  },
  {
    filename: "S12_1774.png",
    phash: "be4f81b094c5ef0a",
    type: "team"
  },
  {
    filename: "S12_1779.png",
    phash: "b061cf96c7cc6493",
    type: "team"
  },
  {
    filename: "S12_1781.png",
    phash: "942b6af0a58bd62d",
    type: "team"
  },
  {
    filename: "S12_1782.png",
    phash: "9893674d616cceb2",
    type: "team"
  },
  {
    filename: "S12_1794.png",
    phash: "a9d2d62921d65e69",
    type: "team"
  },
  {
    filename: "S12_1795.png",
    phash: "bad9c5223ad9e522",
    type: "team"
  },
  {
    filename: "S13_1813.png",
    phash: "80763fc9c53a7887",
    type: "team"
  },
  {
    filename: "S13_1828.png",
    phash: "ebcbd034352d4ad2",
    type: "team"
  },
  {
    filename: "S13_1830.png",
    phash: "af93a52cb4b332c8",
    type: "team"
  },
  {
    filename: "S13_1834.png",
    phash: "c7986d4f3036199b",
    type: "team"
  },
  {
    filename: "S13_1839.png",
    phash: "c46b6ea1319233cf",
    type: "team"
  },
  {
    filename: "S13_1845.png",
    phash: "e87897876c789187",
    type: "team"
  },
  {
    filename: "S13_1854.png",
    phash: "ea8e85e1d032c76b",
    type: "team"
  },
  {
    filename: "S13_1864.png",
    phash: "ef66f0989b0d0d43",
    type: "team"
  },
  {
    filename: "S13_1870.png",
    phash: "a4d9bb6671897461",
    type: "team"
  },
  {
    filename: "S13_1877.png",
    phash: "aa90d57f3b80407f",
    type: "team"
  },
  {
    filename: "S13_1880.png",
    phash: "cc333364e6999966",
    type: "team"
  },
  {
    filename: "S13_1881.png",
    phash: "af2bd0d40f3b2b84",
    type: "team"
  },
  {
    filename: "S13_1886.png",
    phash: "9661673859ce19e3",
    type: "team"
  },
  {
    filename: "S13_1889.png",
    phash: "9866673939c69639",
    type: "team"
  },
  {
    filename: "S13_1892.png",
    phash: "e61f9960629f9d60",
    type: "team"
  },
  {
    filename: "S13_1893.png",
    phash: "838f18b04fc6731f",
    type: "team"
  },
  {
    filename: "S13_1894.png",
    phash: "84e71fde68586178",
    type: "team"
  },
  {
    filename: "S13_1896.png",
    phash: "e4349bdb34644ab6",
    type: "team"
  },
  {
    filename: "S13_1897.png",
    phash: "9661673859ce19e3",
    type: "team"
  },
  {
    filename: "S13_1901.png",
    phash: "acc3ff90b1c68392",
    type: "team"
  },
  {
    filename: "S13_1902.png",
    phash: "c5d948c43b764e1b",
    type: "team"
  },
  {
    filename: "S13_1903.png",
    phash: "d54a6a95946a6b95",
    type: "team"
  },
  {
    filename: "S13_1907.png",
    phash: "c1663e99856359b6",
    type: "team"
  },
  {
    filename: "S13_1908.png",
    phash: "acc3ff90b1c68392",
    type: "team"
  },
  {
    filename: "S13_1909.png",
    phash: "db7c489737936122",
    type: "team"
  },
  {
    filename: "S13_1913.png",
    phash: "d0bd2f42d43d2bc2",
    type: "team"
  },
  {
    filename: "S13_1920.png",
    phash: "e4399fc663e13438",
    type: "team"
  },
  {
    filename: "S13_1921.png",
    phash: "936d6c92c56c3a1b",
    type: "team"
  },
  {
    filename: "S13_1922.png",
    phash: "be4f81b094c5ef0a",
    type: "team"
  },
  {
    filename: "S13_1925.png",
    phash: "fa5d85a03a5fc5a0",
    type: "team"
  },
  {
    filename: "S13_1935.png",
    phash: "c7c33c3c61c3963c",
    type: "team"
  },
  {
    filename: "S13_1939.png",
    phash: "a6cecf3199936446",
    type: "team"
  },
  {
    filename: "S13_1942.png",
    phash: "b4e6cf9893493c32",
    type: "team"
  },
  {
    filename: "S13_1943.png",
    phash: "a065cf9a98cd659a",
    type: "team"
  },
  {
    filename: "S13_1946.png",
    phash: "9b3030cdcdb3936c",
    type: "team"
  },
  {
    filename: "S13_1948.png",
    phash: "9e39646633c95966",
    type: "team"
  },
  {
    filename: "S13_1954.png",
    phash: "c7cf3d3c26643892",
    type: "team"
  },
  {
    filename: "S13_1956.png",
    phash: "bbb1c44e3ab1b10e",
    type: "team"
  },
  {
    filename: "S13_1961.png",
    phash: "db7c489737936122",
    type: "team"
  },
  {
    filename: "S13_1962.png",
    phash: "95856a7a95856a7a",
    type: "team"
  },
  {
    filename: "S13_1968.png",
    phash: "eac4953b6ac4833b",
    type: "team"
  },
  {
    filename: "S14_1970.png",
    phash: "ba12c5e55a12b5ad",
    type: "team"
  },
  {
    filename: "S14_1975.png",
    phash: "9e39646633c95966",
    type: "team"
  },
  {
    filename: "S14_1978.png",
    phash: "ba96c4693a96cc69",
    type: "team"
  },
  {
    filename: "S14_1979.png",
    phash: "af84d06b6f94906b",
    type: "team"
  },
  {
    filename: "S14_1982.png",
    phash: "ea7895856a7a9585",
    type: "team"
  },
  {
    filename: "S14_1987.png",
    phash: "fa1a85a19a86c977",
    type: "team"
  },
  {
    filename: "S14_1993.png",
    phash: "9893674d616cceb2",
    type: "team"
  },
  {
    filename: "S14_1996.png",
    phash: "8fe0f00f2ff0906b",
    type: "team"
  },
  {
    filename: "S14_1997.png",
    phash: "ac96c3498eb49973",
    type: "team"
  },
  {
    filename: "S14_2000.png",
    phash: "a346dcb9234695b9",
    type: "team"
  },
  {
    filename: "S14_2001.png",
    phash: "96396b8695397a46",
    type: "team"
  },
  {
    filename: "S14_2004.png",
    phash: "d48c2b33d4cc2f33",
    type: "team"
  },
  {
    filename: "S14_2005.png",
    phash: "e87897876c789187",
    type: "team"
  },
  {
    filename: "S14_2006.png",
    phash: "af0ed0f02f2ad495",
    type: "team"
  },
  {
    filename: "S14_2010.png",
    phash: "c4927b6c9693696c",
    type: "team"
  },
  {
    filename: "S14_2016.png",
    phash: "956a7a916935863e",
    type: "team"
  },
  {
    filename: "S14_2017.png",
    phash: "9de66219bde6021d",
    type: "team"
  },
  {
    filename: "S14_2019.png",
    phash: "af0ed0f02f2ad495",
    type: "team"
  },
  {
    filename: "S14_2022.png",
    phash: "eee291196ae68599",
    type: "team"
  },
  {
    filename: "S14_2026.png",
    phash: "d4783b87c4787a85",
    type: "team"
  },
  {
    filename: "S14_2030.png",
    phash: "afcaf09297258f24",
    type: "team"
  },
  {
    filename: "S14_2032.png",
    phash: "96396b8695397a46",
    type: "team"
  },
  {
    filename: "S14_2033.png",
    phash: "b4e6cf9893493c32",
    type: "team"
  },
  {
    filename: "S14_2034.png",
    phash: "c11c6c6396b06f1f",
    type: "team"
  },
  {
    filename: "S14_2041.png",
    phash: "ab1fd4e02b1f96c0",
    type: "team"
  },
  {
    filename: "S14_2042.png",
    phash: "b8c99336cd31c533",
    type: "team"
  },
  {
    filename: "S14_2044.png",
    phash: "846f1a3a5f317945",
    type: "team"
  },
  {
    filename: "S14_2045.png",
    phash: "9a3ce5c31a3dec82",
    type: "team"
  },
  {
    filename: "S14_2048.png",
    phash: "b173ce8c3173c68c",
    type: "team"
  },
  {
    filename: "S14_2051.png",
    phash: "944a3fbd6394e462",
    type: "team"
  },
  {
    filename: "S14_2052.png",
    phash: "db7c489737936122",
    type: "team"
  },
  {
    filename: "S14_2053.png",
    phash: "999a66613266cd9b",
    type: "team"
  },
  {
    filename: "S14_2058.png",
    phash: "cf9838e7641c3333",
    type: "team"
  },
  {
    filename: "S14_2059.png",
    phash: "acc3ff90b1c68392",
    type: "team"
  },
  {
    filename: "S14_2060.png",
    phash: "c46b6ea1319233cf",
    type: "team"
  },
  {
    filename: "S14_2062.png",
    phash: "beb4c44ac94f9391",
    type: "team"
  },
  {
    filename: "S14_2064.png",
    phash: "af95976ac295604b",
    type: "team"
  },
  {
    filename: "S14_2065.png",
    phash: "9e39646633c95966",
    type: "team"
  },
  {
    filename: "S14_2066.png",
    phash: "c90f3e70672536d2",
    type: "team"
  },
  {
    filename: "S14_2068.png",
    phash: "9f38e0c11d3eea61",
    type: "team"
  },
  {
    filename: "S14_2069.png",
    phash: "bc78c30761c99eb4",
    type: "team"
  },
  {
    filename: "S14_2071.png",
    phash: "ef66f0989b0d0d43",
    type: "team"
  },
  {
    filename: "S14_2073.png",
    phash: "e492d7695bc63c30",
    type: "team"
  },
  {
    filename: "S14_2074.png",
    phash: "c59a3b67b8b84345",
    type: "team"
  },
  {
    filename: "S14_2075.png",
    phash: "eb91946a6b95946a",
    type: "team"
  },
  {
    filename: "S14_2077.png",
    phash: "e135ca9a3949b666",
    type: "team"
  },
  {
    filename: "S14_2079.png",
    phash: "a282df7d2082d75d",
    type: "team"
  },
  {
    filename: "S14_2080.png",
    phash: "f993866c3993866c",
    type: "team"
  },
  {
    filename: "S14_2081.png",
    phash: "e6c69338ccc73619",
    type: "team"
  },
  {
    filename: "S14_2082.png",
    phash: "a766cc999991316e",
    type: "team"
  },
  {
    filename: "S14_2083.png",
    phash: "ea0dd5722a0dc772",
    type: "team"
  },
  {
    filename: "S14_2085.png",
    phash: "eeb091464ab83fc5",
    type: "team"
  },
  {
    filename: "S14_2086.png",
    phash: "a1e5de83d5588974",
    type: "team"
  },
  {
    filename: "S14_2090.png",
    phash: "838df860039fff60",
    type: "team"
  },
  {
    filename: "S14_2094.png",
    phash: "9e39646633c95966",
    type: "team"
  },
  {
    filename: "S14_2096.png",
    phash: "91496eb499cfc139",
    type: "team"
  },
  {
    filename: "S14_2101.png",
    phash: "ef8790386e8791d8",
    type: "team"
  },
  {
    filename: "S14_2102.png",
    phash: "abc0d43e2fc1d03e",
    type: "team"
  },
  {
    filename: "S14_2105.png",
    phash: "fef881833a7ec481",
    type: "team"
  },
  {
    filename: "S14_2107.png",
    phash: "ee6cb993e48c2661",
    type: "team"
  },
  {
    filename: "S14_2109.png",
    phash: "e9c1863e9039b6c7",
    type: "team"
  },
  {
    filename: "S14_2112.png",
    phash: "ce66319966669966",
    type: "team"
  },
  {
    filename: "S14_2117.png",
    phash: "93342dcb72dc3784",
    type: "team"
  },
  {
    filename: "S14_2118.png",
    phash: "edcc9232c94de634",
    type: "team"
  },
  {
    filename: "S14_2119.png",
    phash: "acc3ff90b1c68392",
    type: "team"
  },
  {
    filename: "S15_2120.png",
    phash: "bc2dc3d23c2dc1d2",
    type: "team"
  },
  {
    filename: "S15_2123.png",
    phash: "91e64f196ce63139",
    type: "team"
  },
  {
    filename: "S15_2126.png",
    phash: "d4e1eb9694192b36",
    type: "team"
  },
  {
    filename: "S15_2127.png",
    phash: "a6b49ec3c3699c34",
    type: "team"
  },
  {
    filename: "S15_2128.png",
    phash: "adc6d219cf643833",
    type: "team"
  },
  {
    filename: "S15_2129.png",
    phash: "bbb19a4ec43a3991",
    type: "team"
  },
  {
    filename: "S15_2130.png",
    phash: "be93c16c2e93946c",
    type: "team"
  },
  {
    filename: "S15_2131.png",
    phash: "af0ed0f02f2ad495",
    type: "team"
  },
  {
    filename: "S15_2132.png",
    phash: "ea83957c6a83857c",
    type: "team"
  },
  {
    filename: "S15_2133.png",
    phash: "ef3290856f72948d",
    type: "team"
  },
  {
    filename: "S15_2134.png",
    phash: "b9b1c2e3198ee46c",
    type: "team"
  },
  {
    filename: "S15_2136.png",
    phash: "9f38e0c11d3eea61",
    type: "team"
  },
  {
    filename: "S15_2137.png",
    phash: "f100aacf3930e5cf",
    type: "team"
  },
  {
    filename: "S15_2138.png",
    phash: "957b6a84953b6ac4",
    type: "team"
  },
  {
    filename: "S15_2139.png",
    phash: "bf0ec0e13d846a6b",
    type: "team"
  },
  {
    filename: "S15_2141.png",
    phash: "b8e3259d07cb5887",
    type: "team"
  },
  {
    filename: "S15_2142.png",
    phash: "bf3bc0c42a021f3f",
    type: "team"
  },
  {
    filename: "S15_2143.png",
    phash: "91b16ec666293979",
    type: "team"
  },
  {
    filename: "S15_2144.png",
    phash: "929a6de5961b33a4",
    type: "team"
  },
  {
    filename: "S15_2145.png",
    phash: "84b71fca781d6169",
    type: "team"
  },
  {
    filename: "S15_2146.png",
    phash: "af2bd0d40f3b2b84",
    type: "team"
  },
  {
    filename: "S15_2147.png",
    phash: "891b3764ce19b167",
    type: "team"
  },
  {
    filename: "S15_2149.png",
    phash: "db7c489737936122",
    type: "team"
  },
  {
    filename: "S15_2151.png",
    phash: "ef9290696b923c69",
    type: "team"
  },
  {
    filename: "S15_2152.png",
    phash: "ef9290696b923c69",
    type: "team"
  },
  {
    filename: "S15_2153.png",
    phash: "9e39646633c95966",
    type: "team"
  },
  {
    filename: "S15_2154.png",
    phash: "e9c1963e6961629e",
    type: "team"
  },
  {
    filename: "S15_2155.png",
    phash: "ab2fd4c02b3fd4c0",
    type: "team"
  },
  {
    filename: "S15_2157.png",
    phash: "acc3ff90b1c68392",
    type: "team"
  },
  {
    filename: "S15_2158.png",
    phash: "9ff0e00f03729e9c",
    type: "team"
  },
  {
    filename: "S15_2159.png",
    phash: "98586f9790786d87",
    type: "team"
  },
  {
    filename: "S15_2160.png",
    phash: "afc0d02d2fc0d13f",
    type: "team"
  },
  {
    filename: "S15_2161.png",
    phash: "db7c489737936122",
    type: "team"
  },
  {
    filename: "S15_2162.png",
    phash: "c0f23a0fc5f27a0d",
    type: "team"
  },
  {
    filename: "S15_2163.png",
    phash: "b061cf96c7cc6493",
    type: "team"
  },
  {
    filename: "S15_2164.png",
    phash: "ebcbd034352d4ad2",
    type: "team"
  },
  {
    filename: "S15_2165.png",
    phash: "e0901f6fe0901f6f",
    type: "team"
  },
  {
    filename: "S15_2166.png",
    phash: "a065cf9a98cd659a",
    type: "team"
  },
  {
    filename: "S15_2167.png",
    phash: "ef66f0989b0d0d43",
    type: "team"
  },
  {
    filename: "S15_2168.png",
    phash: "9661673859ce19e3",
    type: "team"
  },
  {
    filename: "S15_2170.png",
    phash: "af2bd0d40f3b2b84",
    type: "team"
  },
  {
    filename: "S15_2171.png",
    phash: "acc3ff90b1c68392",
    type: "team"
  },
  {
    filename: "S15_2172.png",
    phash: "b98cc6731a0e61ed",
    type: "team"
  },
  {
    filename: "S15_2174.png",
    phash: "ac96c3498eb49973",
    type: "team"
  },
  {
    filename: "S15_2175.png",
    phash: "b191cf679118d663",
    type: "team"
  },
  {
    filename: "S15_2176.png",
    phash: "af49c0c59f368cc9",
    type: "team"
  },
  {
    filename: "S15_2177.png",
    phash: "ab1fd4e02b1f96c0",
    type: "team"
  },
  {
    filename: "S15_2179.png",
    phash: "93b46cc9973472ca",
    type: "team"
  },
  {
    filename: "S15_2180.png",
    phash: "af2790d86f2790d8",
    type: "team"
  },
  {
    filename: "S15_2181.png",
    phash: "eeb091464ab83fc5",
    type: "team"
  },
  {
    filename: "S15_2182.png",
    phash: "af2bd0d40f3b2b84",
    type: "team"
  },
  {
    filename: "S15_2183.png",
    phash: "cc3133cecc39cc93",
    type: "team"
  },
  {
    filename: "S15_2184.png",
    phash: "c7cf3d3c26643892",
    type: "team"
  },
  {
    filename: "S15_2185.png",
    phash: "fae79470839a489b",
    type: "team"
  },
  {
    filename: "S15_2186.png",
    phash: "bb87c4683f97c068",
    type: "team"
  },
  {
    filename: "S15_2187.png",
    phash: "aee1f195e05b850e",
    type: "team"
  },
  {
    filename: "S15_2188.png",
    phash: "afe0f88785c2528f",
    type: "team"
  },
  {
    filename: "S15_2189.png",
    phash: "d58aaa319d4f64f0",
    type: "team"
  },
  {
    filename: "S15_2191.png",
    phash: "be95c1683e97c168",
    type: "team"
  },
  {
    filename: "S15_2192.png",
    phash: "9661673859ce19e3",
    type: "team"
  },
  {
    filename: "S15_2193.png",
    phash: "e87897876c789187",
    type: "team"
  },
  {
    filename: "S15_2194.png",
    phash: "a9d2d62921d65e69",
    type: "team"
  },
  {
    filename: "S15_2195.png",
    phash: "838f18b04fc6731f",
    type: "team"
  },
  {
    filename: "S15_2196.png",
    phash: "c1663e99856359b6",
    type: "team"
  },
  {
    filename: "S15_2197.png",
    phash: "fae79470839a489b",
    type: "team"
  },
  {
    filename: "S15_2198.png",
    phash: "fe1c80e37f1c84e1",
    type: "team"
  },
  {
    filename: "S15_2199.png",
    phash: "ee38b0cfb132c631",
    type: "team"
  },
  {
    filename: "S15_2201.png",
    phash: "fae79470839a489b",
    type: "team"
  },
  {
    filename: "S15_2203.png",
    phash: "bc2dc3d23c2dc1d2",
    type: "team"
  },
  {
    filename: "S15_2204.png",
    phash: "b173ce8c3173c68c",
    type: "team"
  },
  {
    filename: "S15_2205.png",
    phash: "bbb1c44e3ab1b10e",
    type: "team"
  },
  {
    filename: "S15_2206.png",
    phash: "95846a7b95846a7b",
    type: "team"
  },
  {
    filename: "S15_2207.png",
    phash: "c1611e943e9e6acb",
    type: "team"
  },
  {
    filename: "S15_2208.png",
    phash: "b061cf96c7cc6493",
    type: "team"
  },
  {
    filename: "S15_2209.png",
    phash: "aec8d1373ec8c135",
    type: "team"
  },
  {
    filename: "S15_2211.png",
    phash: "bb8d8463c71eb0a5",
    type: "team"
  },
  {
    filename: "S15_2214.png",
    phash: "e87897876c789187",
    type: "team"
  },
  {
    filename: "S15_2215.png",
    phash: "bb6ac4953b6a8495",
    type: "team"
  },
  {
    filename: "S15_2216.png",
    phash: "c4927b6c9693696c",
    type: "team"
  },
  {
    filename: "S15_2218.png",
    phash: "9e39646633c95966",
    type: "team"
  },
  {
    filename: "S15_2220.png",
    phash: "fae79470839a489b",
    type: "team"
  },
  {
    filename: "S15_2221.png",
    phash: "af93a52cb4b332c8",
    type: "team"
  },
  {
    filename: "S15_2222.png",
    phash: "bc2dc3d23c2dc1d2",
    type: "team"
  },
  {
    filename: "S15_2223.png",
    phash: "be4f81b094c5ef0a",
    type: "team"
  },
  {
    filename: "S15_2224.png",
    phash: "cdcc3232ccc79b98",
    type: "team"
  },
  {
    filename: "S15_2225.png",
    phash: "ef66f0989b0d0d43",
    type: "team"
  },
  {
    filename: "S15_2226.png",
    phash: "acc3ff90b1c68392",
    type: "team"
  },
  {
    filename: "S15_2227.png",
    phash: "ab1fd4e02b1f96c0",
    type: "team"
  },
  {
    filename: "S15_2228.png",
    phash: "edcc9232c94de634",
    type: "team"
  },
  {
    filename: "S15_2229.png",
    phash: "edcc9232c94de634",
    type: "team"
  },
  {
    filename: "S15_2230.png",
    phash: "cba0945f4ba0b45f",
    type: "team"
  },
  {
    filename: "S15_2231.png",
    phash: "b4e6cf9893493c32",
    type: "team"
  },
  {
    filename: "S15_2232.png",
    phash: "b4e6cf9893493c32",
    type: "team"
  },
  {
    filename: "S15_2233.png",
    phash: "fb9884667b998466",
    type: "team"
  },
  {
    filename: "S15_2234.png",
    phash: "ba96c4693a96cc69",
    type: "team"
  },
  {
    filename: "S15_2235.png",
    phash: "af49c0c59f368cc9",
    type: "team"
  },
  {
    filename: "S15_2236.png",
    phash: "d02e2fd1d02e3fc1",
    type: "team"
  },
  {
    filename: "S15_2238.png",
    phash: "af0ed0f02f2ad495",
    type: "team"
  },
  {
    filename: "S15_2239.png",
    phash: "d0692f9694696b96",
    type: "team"
  },
  {
    filename: "S15_2240.png",
    phash: "acc3ff90b1c68392",
    type: "team"
  },
  {
    filename: "S15_2241.png",
    phash: "c4927b6c9693696c",
    type: "team"
  },
  {
    filename: "S15_2242.png",
    phash: "bb96d4696b1e3481",
    type: "team"
  },
  {
    filename: "S15_2243.png",
    phash: "8ff0f00f20a01fdf",
    type: "team"
  },
  {
    filename: "S15_2244.png",
    phash: "a065cf9a98cd659a",
    type: "team"
  },
  {
    filename: "S15_2245.png",
    phash: "b1cdcf326c91306d",
    type: "team"
  },
  {
    filename: "S15_2246.png",
    phash: "9149e6b61d4961de",
    type: "team"
  },
  {
    filename: "S15_2247.png",
    phash: "cba0945f4ba0b45f",
    type: "team"
  },
  {
    filename: "S15_2249.png",
    phash: "bbb1c44e3ab1b10e",
    type: "team"
  },
  {
    filename: "S15_2250.png",
    phash: "e7e0984fd0b66790",
    type: "team"
  },
  {
    filename: "S15_2251.png",
    phash: "afcaf09297258f24",
    type: "team"
  },
  {
    filename: "S15_2252.png",
    phash: "d4e1eb9694192b36",
    type: "team"
  },
  {
    filename: "S15_2253.png",
    phash: "eda19293656d9296",
    type: "team"
  },
  {
    filename: "S15_2255.png",
    phash: "ba3794c8c13c3e95",
    type: "team"
  },
  {
    filename: "S15_2256.png",
    phash: "eda19293656d9296",
    type: "team"
  },
  {
    filename: "S15_2257.png",
    phash: "af49c0c59f368cc9",
    type: "team"
  },
  {
    filename: "S15_2258.png",
    phash: "a9d2d62921d65e69",
    type: "team"
  },
  {
    filename: "S15_2259.png",
    phash: "ca48b7bb14b44b4b",
    type: "team"
  },
  {
    filename: "S15_2260.png",
    phash: "b898c76768989667",
    type: "team"
  },
  {
    filename: "S15_2262.png",
    phash: "ee80917f6e80817f",
    type: "team"
  },
  {
    filename: "S6_377.png",
    phash: "90906f67949c7b63",
    type: "team"
  },
  {
    filename: "S6_380.png",
    phash: "bbb1c44e3ab1b10e",
    type: "team"
  },
  {
    filename: "S6_393.png",
    phash: "eb7bd4ac81d1d10a",
    type: "team"
  },
  {
    filename: "S6_404.png",
    phash: "95856a7a95856a7a",
    type: "team"
  },
  {
    filename: "S6_405.png",
    phash: "eea4c1db965bc124",
    type: "team"
  },
  {
    filename: "S6_413.png",
    phash: "acc3ff90b1c68392",
    type: "team"
  },
  {
    filename: "S6_416.png",
    phash: "911b6ee971654696",
    type: "team"
  },
  {
    filename: "S6_417.png",
    phash: "baa685597aa68559",
    type: "team"
  },
  {
    filename: "S6_421.png",
    phash: "e13496cb98c66c79",
    type: "team"
  },
  {
    filename: "S6_426.png",
    phash: "ff8680396f86a178",
    type: "team"
  },
  {
    filename: "S6_435.png",
    phash: "b366cc99cc333346",
    type: "team"
  },
  {
    filename: "S6_445.png",
    phash: "cbe764189893cd66",
    type: "team"
  },
  {
    filename: "S6_450.png",
    phash: "bc30c7ce99c9c626",
    type: "team"
  },
  {
    filename: "S6_453.png",
    phash: "ea6a95952b6ad095",
    type: "team"
  },
  {
    filename: "S6_457.png",
    phash: "bb6ac4953b6a8495",
    type: "team"
  },
  {
    filename: "S6_462.png",
    phash: "85867a6a793966c3",
    type: "team"
  },
  {
    filename: "S6_464.png",
    phash: "efd4903b2dc94a16",
    type: "team"
  },
  {
    filename: "S6_465.png",
    phash: "95946a6b95946b6a",
    type: "team"
  },
  {
    filename: "S6_468.png",
    phash: "acc3ff90b1c68392",
    type: "team"
  },
  {
    filename: "S6_471.png",
    phash: "ebcbd03435694ad2",
    type: "team"
  },
  {
    filename: "S6_474.png",
    phash: "95856a7a95856a7a",
    type: "team"
  },
  {
    filename: "S6_478.png",
    phash: "ba2dc5d03a2fc5d0",
    type: "team"
  },
  {
    filename: "S6_479.png",
    phash: "d035a1d00fcf6c7a",
    type: "team"
  },
  {
    filename: "S6_480.png",
    phash: "ac96c3498eb49973",
    type: "team"
  },
  {
    filename: "S6_481.png",
    phash: "ea8685793a86c579",
    type: "team"
  },
  {
    filename: "S6_491.png",
    phash: "b366cc99cc333346",
    type: "team"
  },
  {
    filename: "S6_507.png",
    phash: "fae09685c27ac11f",
    type: "team"
  },
  {
    filename: "S6_512.png",
    phash: "db9636c9613d3262",
    type: "team"
  },
  {
    filename: "S6_513.png",
    phash: "c5c53a3ac5d53a2a",
    type: "team"
  },
  {
    filename: "S6_519.png",
    phash: "c39e34e1cd38c32e",
    type: "team"
  },
  {
    filename: "S6_523.png",
    phash: "cbe764189893cd66",
    type: "team"
  },
  {
    filename: "S6_525.png",
    phash: "fe3881877e788187",
    type: "team"
  },
  {
    filename: "S6_530.png",
    phash: "bc364b4d32336c6c",
    type: "team"
  },
  {
    filename: "S6_534.png",
    phash: "a9d2d62921d65e69",
    type: "team"
  },
  {
    filename: "S6_537.png",
    phash: "ef9290696b923c69",
    type: "team"
  },
  {
    filename: "S6_538.png",
    phash: "894c76b3895c76a3",
    type: "team"
  },
  {
    filename: "S6_549.png",
    phash: "c5e5189e4e61399b",
    type: "team"
  },
  {
    filename: "S8_743.png",
    phash: "d4d42b2bd4d42e2b",
    type: "team"
  },
  {
    filename: "S8_757.png",
    phash: "bf1cc0e13f1ec0e1",
    type: "team"
  },
  {
    filename: "S8_761.png",
    phash: "bb6ac4953b6a8495",
    type: "team"
  },
  {
    filename: "S8_770.png",
    phash: "ae27d1d03e27c1d8",
    type: "team"
  },
  {
    filename: "S8_776.png",
    phash: "93342dcb72dc3784",
    type: "team"
  },
  {
    filename: "S8_806.png",
    phash: "fa0b85f47a0b85f0",
    type: "team"
  },
  {
    filename: "S8_814.png",
    phash: "c23d3dc2c23d3dc2",
    type: "team"
  },
  {
    filename: "S8_822.png",
    phash: "c09a3f65c49a7a65",
    type: "team"
  },
  {
    filename: "S8_840.png",
    phash: "bee0c13f3ee09107",
    type: "team"
  },
  {
    filename: "S8_842.png",
    phash: "986667999a662979",
    type: "team"
  },
  {
    filename: "S8_844.png",
    phash: "bf1cc0e13f1ec0e1",
    type: "team"
  },
  {
    filename: "S8_858.png",
    phash: "ac96c3498eb49973",
    type: "team"
  },
  {
    filename: "S8_865.png",
    phash: "8195fe680197fe68",
    type: "team"
  },
  {
    filename: "S8_867.png",
    phash: "c11f3fc0c13f8ec1",
    type: "team"
  },
  {
    filename: "S8_870.png",
    phash: "b2b3894c66b33b4c",
    type: "team"
  },
  {
    filename: "S8_874.png",
    phash: "916b6e91956e6a91",
    type: "team"
  },
  {
    filename: "S8_876.png",
    phash: "c4937b6c9493696c",
    type: "team"
  },
  {
    filename: "S8_877.png",
    phash: "93d36c266a497996",
    type: "team"
  },
  {
    filename: "S8_881.png",
    phash: "ebcbd034352d4ad2",
    type: "team"
  },
  {
    filename: "S8_882.png",
    phash: "c141beba1141cfde",
    type: "team"
  },
  {
    filename: "S8_894.png",
    phash: "ee81913e6ec181be",
    type: "team"
  },
  {
    filename: "S8_904.png",
    phash: "cc9fb340449f9f60",
    type: "team"
  },
  {
    filename: "S8_906.png",
    phash: "cb3f34c03ccc3333",
    type: "team"
  },
  {
    filename: "S8_911.png",
    phash: "ab0ed4f139954e4a",
    type: "team"
  },
  {
    filename: "S8_918.png",
    phash: "bb4ac4b43a4bc5b4",
    type: "team"
  },
  {
    filename: "S8_932.png",
    phash: "a9d2d62921d65e69",
    type: "team"
  },
  {
    filename: "S8_933.png",
    phash: "c49f6a993968b166",
    type: "team"
  },
  {
    filename: "S8_935.png",
    phash: "eb4894b66b49c1b6",
    type: "team"
  },
  {
    filename: "S8_937.png",
    phash: "acc3ff90b1c68392",
    type: "team"
  },
  {
    filename: "S9_1002.png",
    phash: "894c76b3895c76a3",
    type: "team"
  },
  {
    filename: "S9_1005.png",
    phash: "802f7fd4802b3fd4",
    type: "team"
  },
  {
    filename: "S9_1018.png",
    phash: "ba99f9c3221cce64",
    type: "team"
  },
  {
    filename: "S9_1031.png",
    phash: "ff0f80e03d854e5a",
    type: "team"
  },
  {
    filename: "S9_1048.png",
    phash: "84ac7b5384ac7b53",
    type: "team"
  },
  {
    filename: "S9_1054.png",
    phash: "8195fe680197fe68",
    type: "team"
  },
  {
    filename: "S9_1065.png",
    phash: "e3b1c6c3b80ecd29",
    type: "team"
  },
  {
    filename: "S9_1070.png",
    phash: "faa4e1d09725ce58",
    type: "team"
  },
  {
    filename: "S9_1075.png",
    phash: "ec4bc3b5932c3cc2",
    type: "team"
  },
  {
    filename: "S9_1087.png",
    phash: "83d8fc2501dabe65",
    type: "team"
  },
  {
    filename: "S9_1112.png",
    phash: "d0e46f1b90e46e1b",
    type: "team"
  },
  {
    filename: "S9_1115.png",
    phash: "c7c33c3c61c3963c",
    type: "team"
  },
  {
    filename: "S9_1124.png",
    phash: "dc3723ccd4330bcc",
    type: "team"
  },
  {
    filename: "S9_1145.png",
    phash: "d3792c8693696c96",
    type: "team"
  },
  {
    filename: "S9_1151.png",
    phash: "ce66319966669966",
    type: "team"
  },
  {
    filename: "S9_1153.png",
    phash: "ef9290696b923c69",
    type: "team"
  },
  {
    filename: "S9_1163.png",
    phash: "b830c7ce99c9c6c6",
    type: "team"
  },
  {
    filename: "S9_946.png",
    phash: "bf3bc0c4033b3b91",
    type: "team"
  },
  {
    filename: "S9_957.png",
    phash: "c50f9af0600f9ff0",
    type: "team"
  },
  {
    filename: "S9_960.png",
    phash: "ac96c3498eb49973",
    type: "team"
  },
  {
    filename: "S9_968.png",
    phash: "bbe1c71ed819d091",
    type: "team"
  },
  {
    filename: "S9_981.png",
    phash: "e3b1c6c3b80ecd29",
    type: "team"
  },
  {
    filename: "S9_983.png",
    phash: "a1e5de83d5588974",
    type: "team"
  },
  {
    filename: "S9_988.png",
    phash: "d2cf6d30309f0ed2",
    type: "team"
  },
  {
    filename: "S9_991.png",
    phash: "fa0b85f47a0b85f0",
    type: "team"
  },
  {
    filename: "S9_997.png",
    phash: "ff0f80e03d854e5a",
    type: "team"
  },
  {
    filename: "bilar99.png",
    phash: "be98c067c7c3193c",
    type: "team"
  },
  {
    filename: "broman.png",
    phash: "e36b9c90b44d4b33",
    type: "team"
  },
  {
    filename: "decens.png",
    phash: "c1c33e7cc1c374a5",
    type: "team"
  },
  {
    filename: "erillisverkot-team.jpeg",
    phash: "856678677998599a",
    type: "team"
  },
  {
    filename: "etteplan.png",
    phash: "d0d407837a5adf25",
    type: "team"
  },
  {
    filename: "fraidei.png",
    phash: "eb0f94f06b0f90f0",
    type: "team"
  },
  {
    filename: "gim-robotics.png",
    phash: "f80707fdbc80701f",
    type: "team"
  },
  {
    filename: "hsl_team.png",
    phash: "c27b2c2330dec3bc",
    type: "team"
  },
  {
    filename: "istekki.png",
    phash: "ba92c56d3a92946d",
    type: "team"
  },
  {
    filename: "joki_ict.jpg",
    phash: "ec7893876c5c91a3",
    type: "team"
  },
  {
    filename: "neliot-liikkuu-team.jpeg",
    phash: "a533ce86938c93cb",
    type: "team"
  },
  {
    filename: "nologo.png",
    phash: "c163141e6bd36e65",
    type: "team"
  },
  {
    filename: "oulu.jpg",
    phash: "b165cfc6861c9c1b",
    type: "team"
  },
  {
    filename: "pp-ruoka.jpg",
    phash: "c5c61e69699b30c7",
    type: "team"
  },
  {
    filename: "probis_solutions_oy_logo.jpeg",
    phash: "afe6c08d916b921d",
    type: "team"
  },
  {
    filename: "produal.png",
    phash: "db9c6cc3923cc949",
    type: "team"
  },
  {
    filename: "ropo.png",
    phash: "d1e02e1f95e0699e",
    type: "team"
  },
  {
    filename: "sanoma.png",
    phash: "c0c13f3ec0c13f3e",
    type: "team"
  },
  {
    filename: "serviceform.jpg",
    phash: "cdb0364f5bd88427",
    type: "team"
  },
  {
    filename: "sevendos_team.jpg",
    phash: "faa0c585f21c2d76",
    type: "team"
  },
  {
    filename: "sweco.jpg",
    phash: "eaca85357acac135",
    type: "team"
  },
  {
    filename: "talokaivo.png",
    phash: "bf9cc0622f9dd062",
    type: "team"
  },
  {
    filename: "tietoevry_team.png",
    phash: "bb38f0e18e86ccd8",
    type: "team"
  },
  {
    filename: "S10_1192.png",
    phash: "a4659e9ad13bc6c4",
    type: "organization"
  },
  {
    filename: "S10_1220.png",
    phash: "ef3a90c52f3ad0c4",
    type: "organization"
  },
  {
    filename: "S10_1312.png",
    phash: "e0d93f6695996066",
    type: "organization"
  },
  {
    filename: "S10_1324.png",
    phash: "ab39d4c26a3995c6",
    type: "organization"
  },
  {
    filename: "S11_1421.png",
    phash: "eee291196ae68599",
    type: "organization"
  },
  {
    filename: "S11_1426.png",
    phash: "b8bcc3439cfe3281",
    type: "organization"
  },
  {
    filename: "S11_1428.png",
    phash: "fa33c49883c59e4e",
    type: "organization"
  },
  {
    filename: "S11_1431.png",
    phash: "863979c6863979c6",
    type: "organization"
  },
  {
    filename: "S11_1434.png",
    phash: "caa5955a2aa5c57a",
    type: "organization"
  },
  {
    filename: "S11_1439.png",
    phash: "ea1e95e16b1e94c1",
    type: "organization"
  },
  {
    filename: "S11_1441.png",
    phash: "80763fc9c53a7887",
    type: "organization"
  },
  {
    filename: "S11_1444.png",
    phash: "efa9d0562ea8c42b",
    type: "organization"
  },
  {
    filename: "S11_1447.png",
    phash: "c5c13a3ed4c1c93e",
    type: "organization"
  },
  {
    filename: "S11_1449.png",
    phash: "af26d0d12f2ed0d1",
    type: "organization"
  },
  {
    filename: "S11_1455.png",
    phash: "84ac7b5384ac7b53",
    type: "organization"
  },
  {
    filename: "S11_1457.png",
    phash: "ae5ad1a52e5ac585",
    type: "organization"
  },
  {
    filename: "S11_1463.png",
    phash: "eb9684697b968469",
    type: "organization"
  },
  {
    filename: "S11_1464.png",
    phash: "bf1ec0e03f1ec0e1",
    type: "organization"
  },
  {
    filename: "S11_1466.png",
    phash: "f885d35a857c46a5",
    type: "organization"
  },
  {
    filename: "S11_1471.png",
    phash: "a7f8c802257da7a6",
    type: "organization"
  },
  {
    filename: "S11_1481.png",
    phash: "c0f23a0fc5f27a0d",
    type: "organization"
  },
  {
    filename: "S11_1483.png",
    phash: "bb91e42493d9ce31",
    type: "organization"
  },
  {
    filename: "S11_1486.png",
    phash: "911b6ee971654696",
    type: "organization"
  },
  {
    filename: "S11_1487.png",
    phash: "fb6a84957b6a8095",
    type: "organization"
  },
  {
    filename: "S11_1490.png",
    phash: "efd0902b6fd0902f",
    type: "organization"
  },
  {
    filename: "S11_1499.png",
    phash: "af13b0ccd8b6c632",
    type: "organization"
  },
  {
    filename: "S11_1501.png",
    phash: "9f38e0871f78e407",
    type: "organization"
  },
  {
    filename: "S11_1506.png",
    phash: "eb7c94832b6cd093",
    type: "organization"
  },
  {
    filename: "S11_1516.png",
    phash: "bfc3c0343fcbc034",
    type: "organization"
  },
  {
    filename: "S11_1519.png",
    phash: "c11f3fc0c13f8ec1",
    type: "organization"
  },
  {
    filename: "S11_1520.png",
    phash: "875cf883077cfc84",
    type: "organization"
  },
  {
    filename: "S11_1522.png",
    phash: "b864c19bce323a6d",
    type: "organization"
  },
  {
    filename: "S11_1525.png",
    phash: "ce66319966669966",
    type: "organization"
  },
  {
    filename: "S11_1535.png",
    phash: "8f85f0780685f97a",
    type: "organization"
  },
  {
    filename: "S11_1546.png",
    phash: "ea2c95c36a3c95c3",
    type: "organization"
  },
  {
    filename: "S11_1552.png",
    phash: "ae27d1d03e27c1d8",
    type: "organization"
  },
  {
    filename: "S11_1554.png",
    phash: "ef13f0a4e792864a",
    type: "organization"
  },
  {
    filename: "S11_1556.png",
    phash: "d2633d9cc3639239",
    type: "organization"
  },
  {
    filename: "S11_1558.png",
    phash: "b365cf1a9093c66c",
    type: "organization"
  },
  {
    filename: "S11_1560.png",
    phash: "ba99f9c3221cce64",
    type: "organization"
  },
  {
    filename: "S11_1573.png",
    phash: "eb82941ecb699c36",
    type: "organization"
  },
  {
    filename: "S11_1577.png",
    phash: "d06f2f98d0670f98",
    type: "organization"
  },
  {
    filename: "S11_1580.png",
    phash: "ece4cb9c3033e346",
    type: "organization"
  },
  {
    filename: "S11_1584.png",
    phash: "e6e2991de66618cc",
    type: "organization"
  },
  {
    filename: "S11_1588.png",
    phash: "bbb1c44e4e04b9b3",
    type: "organization"
  },
  {
    filename: "S11_1589.png",
    phash: "a3f0d88dd91e0d72",
    type: "organization"
  },
  {
    filename: "S11_1593.png",
    phash: "ec4bc3b5932c3cc2",
    type: "organization"
  },
  {
    filename: "S11_1595.png",
    phash: "adc9d13632c96d34",
    type: "organization"
  },
  {
    filename: "S11_1596.png",
    phash: "af1dd0626b9d9462",
    type: "organization"
  },
  {
    filename: "S11_1597.png",
    phash: "fe3881877e788187",
    type: "organization"
  },
  {
    filename: "S11_1606.png",
    phash: "ba2dc5d03a2fc5d0",
    type: "organization"
  },
  {
    filename: "S11_1608.png",
    phash: "91d03e2f0b6de594",
    type: "organization"
  },
  {
    filename: "S11_1611.png",
    phash: "e83c87cb9a326ccc",
    type: "organization"
  },
  {
    filename: "S11_1612.png",
    phash: "91b16ec666293979",
    type: "organization"
  },
  {
    filename: "S11_1613.png",
    phash: "d2cf6d30309f0ed2",
    type: "organization"
  },
  {
    filename: "S11_1622.png",
    phash: "ea2c95c36a3c95c3",
    type: "organization"
  },
  {
    filename: "S11_1626.png",
    phash: "c4b23b4d3b3264cd",
    type: "organization"
  },
  {
    filename: "S11_1628.png",
    phash: "faa4e1d09725ce58",
    type: "organization"
  },
  {
    filename: "S11_1631.png",
    phash: "bac7cc38c5389387",
    type: "organization"
  },
  {
    filename: "S11_1636.png",
    phash: "81affe7005afc950",
    type: "organization"
  },
  {
    filename: "S11_1637.png",
    phash: "83e0fc1f03c0bc3f",
    type: "organization"
  },
  {
    filename: "S11_1639.png",
    phash: "e9e39a9cc03cc36a",
    type: "organization"
  },
  {
    filename: "S11_1645.png",
    phash: "c3323cc93bc6c5b1",
    type: "organization"
  },
  {
    filename: "S11_1647.png",
    phash: "d58aaa319d4f64f0",
    type: "organization"
  },
  {
    filename: "S11_1648.png",
    phash: "bd94c239976e91e0",
    type: "organization"
  },
  {
    filename: "S12_1659.png",
    phash: "bf66c0993f6680d1",
    type: "organization"
  },
  {
    filename: "S12_1667.png",
    phash: "be80c13f3ec0c13f",
    type: "organization"
  },
  {
    filename: "S12_1678.png",
    phash: "895e73215e93c55c",
    type: "organization"
  },
  {
    filename: "S12_1691.png",
    phash: "af84d072668c9bf2",
    type: "organization"
  },
  {
    filename: "S12_1702.png",
    phash: "d4cc6b7395ccc036",
    type: "organization"
  },
  {
    filename: "S12_1707.png",
    phash: "9b21250fcb97353c",
    type: "organization"
  },
  {
    filename: "S12_1713.png",
    phash: "8195fe680197fe68",
    type: "organization"
  },
  {
    filename: "S12_1725.png",
    phash: "af0ed0f02f2ad495",
    type: "organization"
  },
  {
    filename: "S12_1738.png",
    phash: "eba0945e6ba1945e",
    type: "organization"
  },
  {
    filename: "S12_1765.png",
    phash: "a8f5921add0ac7c6",
    type: "organization"
  },
  {
    filename: "S12_1779.png",
    phash: "b061cf96c7cc6493",
    type: "organization"
  },
  {
    filename: "S12_1781.png",
    phash: "942b6af0a58bd62d",
    type: "organization"
  },
  {
    filename: "S12_1794.png",
    phash: "a9d2d62921d65e69",
    type: "organization"
  },
  {
    filename: "S12_1795.png",
    phash: "bad9c5223ad9e522",
    type: "organization"
  },
  {
    filename: "S13_1828.png",
    phash: "ebcbd034352d4ad2",
    type: "organization"
  },
  {
    filename: "S13_1834.png",
    phash: "c7986d4f3036199b",
    type: "organization"
  },
  {
    filename: "S13_1845.png",
    phash: "e87897876c789187",
    type: "organization"
  },
  {
    filename: "S13_1854.png",
    phash: "ea8e85e1d032c76b",
    type: "organization"
  },
  {
    filename: "S13_1870.png",
    phash: "a4d9bb6671897461",
    type: "organization"
  },
  {
    filename: "S13_1877.png",
    phash: "aa90d57f3b80407f",
    type: "organization"
  },
  {
    filename: "S13_1889.png",
    phash: "9866673939c69639",
    type: "organization"
  },
  {
    filename: "S13_1892.png",
    phash: "e61f9960629f9d60",
    type: "organization"
  },
  {
    filename: "S13_1893.png",
    phash: "838f18b04fc6731f",
    type: "organization"
  },
  {
    filename: "S13_1896.png",
    phash: "e4349bdb34644ab6",
    type: "organization"
  },
  {
    filename: "S13_1902.png",
    phash: "c5d948c43b764e1b",
    type: "organization"
  },
  {
    filename: "S13_1903.png",
    phash: "d54a6a95946a6b95",
    type: "organization"
  },
  {
    filename: "S13_1913.png",
    phash: "d0bd2f42d43d2bc2",
    type: "organization"
  },
  {
    filename: "S13_1920.png",
    phash: "e4399fc663e13438",
    type: "organization"
  },
  {
    filename: "S13_1921.png",
    phash: "936d6c92c56c3a1b",
    type: "organization"
  },
  {
    filename: "S13_1922.png",
    phash: "be4f81b094c5ef0a",
    type: "organization"
  },
  {
    filename: "S13_1925.png",
    phash: "fa5d85a03a5fc5a0",
    type: "organization"
  },
  {
    filename: "S13_1935.png",
    phash: "c7c33c3c61c3963c",
    type: "organization"
  },
  {
    filename: "S13_1942.png",
    phash: "b4e6cf9893493c32",
    type: "organization"
  },
  {
    filename: "S13_1946.png",
    phash: "9b3030cdcdb3936c",
    type: "organization"
  },
  {
    filename: "S13_1956.png",
    phash: "bbb1c44e3ab1b10e",
    type: "organization"
  },
  {
    filename: "S13_1962.png",
    phash: "95856a7a95856a7a",
    type: "organization"
  },
  {
    filename: "S13_1968.png",
    phash: "eac4953b6ac4833b",
    type: "organization"
  },
  {
    filename: "S14_1970.png",
    phash: "ba12c5e55a12b5ad",
    type: "organization"
  },
  {
    filename: "S14_1975.png",
    phash: "9e39646633c95966",
    type: "organization"
  },
  {
    filename: "S14_1978.png",
    phash: "ba96c4693a96cc69",
    type: "organization"
  },
  {
    filename: "S14_1979.png",
    phash: "af84d06b6f94906b",
    type: "organization"
  },
  {
    filename: "S14_1982.png",
    phash: "ea7895856a7a9585",
    type: "organization"
  },
  {
    filename: "S14_1987.png",
    phash: "fa1a85a19a86c977",
    type: "organization"
  },
  {
    filename: "S14_1993.png",
    phash: "9893674d616cceb2",
    type: "organization"
  },
  {
    filename: "S14_1996.png",
    phash: "8fe0f00f2ff0906b",
    type: "organization"
  },
  {
    filename: "S14_1997.png",
    phash: "ac96c3498eb49973",
    type: "organization"
  },
  {
    filename: "S14_2000.png",
    phash: "a346dcb9234695b9",
    type: "organization"
  },
  {
    filename: "S14_2001.png",
    phash: "96396b8695397a46",
    type: "organization"
  },
  {
    filename: "S14_2004.png",
    phash: "d48c2b33d4cc2f33",
    type: "organization"
  },
  {
    filename: "S14_2016.png",
    phash: "956a7a916935863e",
    type: "organization"
  },
  {
    filename: "S14_2017.png",
    phash: "9de66219bde6021d",
    type: "organization"
  },
  {
    filename: "S14_2026.png",
    phash: "d4783b87c4787a85",
    type: "organization"
  },
  {
    filename: "S14_2030.png",
    phash: "afcaf09297258f24",
    type: "organization"
  },
  {
    filename: "S14_2034.png",
    phash: "c11c6c6396b06f1f",
    type: "organization"
  },
  {
    filename: "S14_2042.png",
    phash: "b8c99336cd31c533",
    type: "organization"
  },
  {
    filename: "S14_2044.png",
    phash: "846f1a3a5f317945",
    type: "organization"
  },
  {
    filename: "S14_2045.png",
    phash: "9a3ce5c31a3dec82",
    type: "organization"
  },
  {
    filename: "S14_2051.png",
    phash: "944a3fbd6394e462",
    type: "organization"
  },
  {
    filename: "S14_2052.png",
    phash: "db7c489737936122",
    type: "organization"
  },
  {
    filename: "S14_2053.png",
    phash: "999a66613266cd9b",
    type: "organization"
  },
  {
    filename: "S14_2058.png",
    phash: "cf9838e7641c3333",
    type: "organization"
  },
  {
    filename: "S14_2059.png",
    phash: "acc3ff90b1c68392",
    type: "organization"
  },
  {
    filename: "S14_2060.png",
    phash: "c46b6ea1319233cf",
    type: "organization"
  },
  {
    filename: "S14_2062.png",
    phash: "beb4c44ac94f9391",
    type: "organization"
  },
  {
    filename: "S14_2064.png",
    phash: "af95976ac295604b",
    type: "organization"
  },
  {
    filename: "S14_2066.png",
    phash: "c90f3e70672536d2",
    type: "organization"
  },
  {
    filename: "S14_2068.png",
    phash: "9f38e0c11d3eea61",
    type: "organization"
  },
  {
    filename: "S14_2069.png",
    phash: "bc78c30761c99eb4",
    type: "organization"
  },
  {
    filename: "S14_2071.png",
    phash: "ef66f0989b0d0d43",
    type: "organization"
  },
  {
    filename: "S14_2073.png",
    phash: "e492d7695bc63c30",
    type: "organization"
  },
  {
    filename: "S14_2075.png",
    phash: "eb91946a6b95946a",
    type: "organization"
  },
  {
    filename: "S14_2077.png",
    phash: "e135ca9a3949b666",
    type: "organization"
  },
  {
    filename: "S14_2079.png",
    phash: "a282df7d2082d75d",
    type: "organization"
  },
  {
    filename: "S14_2080.png",
    phash: "f993866c3993866c",
    type: "organization"
  },
  {
    filename: "S14_2081.png",
    phash: "e6c69338ccc73619",
    type: "organization"
  },
  {
    filename: "S14_2082.png",
    phash: "a766cc999991316e",
    type: "organization"
  },
  {
    filename: "S14_2083.png",
    phash: "ea0dd5722a0dc772",
    type: "organization"
  },
  {
    filename: "S14_2085.png",
    phash: "eeb091464ab83fc5",
    type: "organization"
  },
  {
    filename: "S14_2086.png",
    phash: "a1e5de83d5588974",
    type: "organization"
  },
  {
    filename: "S14_2090.png",
    phash: "838df860039fff60",
    type: "organization"
  },
  {
    filename: "S14_2096.png",
    phash: "91496eb499cfc139",
    type: "organization"
  },
  {
    filename: "S14_2101.png",
    phash: "ef8790386e8791d8",
    type: "organization"
  },
  {
    filename: "S14_2102.png",
    phash: "abc0d43e2fc1d03e",
    type: "organization"
  },
  {
    filename: "S14_2105.png",
    phash: "fef881833a7ec481",
    type: "organization"
  },
  {
    filename: "S14_2107.png",
    phash: "ee6cb993e48c2661",
    type: "organization"
  },
  {
    filename: "S14_2109.png",
    phash: "e9c1863e9039b6c7",
    type: "organization"
  },
  {
    filename: "S14_2112.png",
    phash: "ce66319966669966",
    type: "organization"
  },
  {
    filename: "S14_2117.png",
    phash: "93342dcb72dc3784",
    type: "organization"
  },
  {
    filename: "S15_2123.png",
    phash: "91e64f196ce63139",
    type: "organization"
  },
  {
    filename: "S15_2126.png",
    phash: "d4e1eb9694192b36",
    type: "organization"
  },
  {
    filename: "S15_2127.png",
    phash: "a6b49ec3c3699c34",
    type: "organization"
  },
  {
    filename: "S15_2128.png",
    phash: "adc6d219cf643833",
    type: "organization"
  },
  {
    filename: "S15_2129.png",
    phash: "bbb19a4ec43a3991",
    type: "organization"
  },
  {
    filename: "S15_2130.png",
    phash: "be93c16c2e93946c",
    type: "organization"
  },
  {
    filename: "S15_2133.png",
    phash: "ef3290856f72948d",
    type: "organization"
  },
  {
    filename: "S15_2134.png",
    phash: "b9b1c2e3198ee46c",
    type: "organization"
  },
  {
    filename: "S15_2137.png",
    phash: "f100aacf3930e5cf",
    type: "organization"
  },
  {
    filename: "S15_2138.png",
    phash: "957b6a84953b6ac4",
    type: "organization"
  },
  {
    filename: "S15_2139.png",
    phash: "bf0ec0e13d846a6b",
    type: "organization"
  },
  {
    filename: "S15_2141.png",
    phash: "b8e3259d07cb5887",
    type: "organization"
  },
  {
    filename: "S15_2142.png",
    phash: "bf3bc0c42a021f3f",
    type: "organization"
  },
  {
    filename: "S15_2144.png",
    phash: "929a6de5961b33a4",
    type: "organization"
  },
  {
    filename: "S15_2145.png",
    phash: "84b71fca781d6169",
    type: "organization"
  },
  {
    filename: "S15_2146.png",
    phash: "af2bd0d40f3b2b84",
    type: "organization"
  },
  {
    filename: "S15_2147.png",
    phash: "891b3764ce19b167",
    type: "organization"
  },
  {
    filename: "S15_2152.png",
    phash: "ef9290696b923c69",
    type: "organization"
  },
  {
    filename: "S15_2154.png",
    phash: "e9c1963e6961629e",
    type: "organization"
  },
  {
    filename: "S15_2155.png",
    phash: "ab2fd4c02b3fd4c0",
    type: "organization"
  },
  {
    filename: "S15_2158.png",
    phash: "9ff0e00f03729e9c",
    type: "organization"
  },
  {
    filename: "S15_2159.png",
    phash: "98586f9790786d87",
    type: "organization"
  },
  {
    filename: "S15_2160.png",
    phash: "afc0d02d2fc0d13f",
    type: "organization"
  },
  {
    filename: "S15_2163.png",
    phash: "b061cf96c7cc6493",
    type: "organization"
  },
  {
    filename: "S15_2165.png",
    phash: "e0901f6fe0901f6f",
    type: "organization"
  },
  {
    filename: "S15_2166.png",
    phash: "a065cf9a98cd659a",
    type: "organization"
  },
  {
    filename: "S15_2172.png",
    phash: "b98cc6731a0e61ed",
    type: "organization"
  },
  {
    filename: "S15_2175.png",
    phash: "b191cf679118d663",
    type: "organization"
  },
  {
    filename: "S15_2179.png",
    phash: "93b46cc9973472ca",
    type: "organization"
  },
  {
    filename: "S15_2180.png",
    phash: "af2790d86f2790d8",
    type: "organization"
  },
  {
    filename: "S15_2183.png",
    phash: "cc3133cecc39cc93",
    type: "organization"
  },
  {
    filename: "S15_2184.png",
    phash: "c7cf3d3c26643892",
    type: "organization"
  },
  {
    filename: "S15_2186.png",
    phash: "bb87c4683f97c068",
    type: "organization"
  },
  {
    filename: "S15_2187.png",
    phash: "aee1f195e05b850e",
    type: "organization"
  },
  {
    filename: "S15_2188.png",
    phash: "afe0f88785c2528f",
    type: "organization"
  },
  {
    filename: "S15_2191.png",
    phash: "be95c1683e97c168",
    type: "organization"
  },
  {
    filename: "S15_2192.png",
    phash: "9661673859ce19e3",
    type: "organization"
  },
  {
    filename: "S15_2196.png",
    phash: "c1663e99856359b6",
    type: "organization"
  },
  {
    filename: "S15_2197.png",
    phash: "fae79470839a489b",
    type: "organization"
  },
  {
    filename: "S15_2198.png",
    phash: "fe1c80e37f1c84e1",
    type: "organization"
  },
  {
    filename: "S15_2199.png",
    phash: "ee38b0cfb132c631",
    type: "organization"
  },
  {
    filename: "S15_2204.png",
    phash: "b173ce8c3173c68c",
    type: "organization"
  },
  {
    filename: "S15_2206.png",
    phash: "95846a7b95846a7b",
    type: "organization"
  },
  {
    filename: "S15_2207.png",
    phash: "c1611e943e9e6acb",
    type: "organization"
  },
  {
    filename: "S15_2209.png",
    phash: "aec8d1373ec8c135",
    type: "organization"
  },
  {
    filename: "S15_2211.png",
    phash: "bb8d8463c71eb0a5",
    type: "organization"
  },
  {
    filename: "S15_2215.png",
    phash: "bb6ac4953b6a8495",
    type: "organization"
  },
  {
    filename: "S15_2216.png",
    phash: "c4927b6c9693696c",
    type: "organization"
  },
  {
    filename: "S15_2221.png",
    phash: "af93a52cb4b332c8",
    type: "organization"
  },
  {
    filename: "S15_2222.png",
    phash: "bc2dc3d23c2dc1d2",
    type: "organization"
  },
  {
    filename: "S15_2224.png",
    phash: "cdcc3232ccc79b98",
    type: "organization"
  },
  {
    filename: "S15_2227.png",
    phash: "ab1fd4e02b1f96c0",
    type: "organization"
  },
  {
    filename: "S15_2228.png",
    phash: "edcc9232c94de634",
    type: "organization"
  },
  {
    filename: "S15_2230.png",
    phash: "cba0945f4ba0b45f",
    type: "organization"
  },
  {
    filename: "S15_2233.png",
    phash: "fb9884667b998466",
    type: "organization"
  },
  {
    filename: "S15_2235.png",
    phash: "af49c0c59f368cc9",
    type: "organization"
  },
  {
    filename: "S15_2236.png",
    phash: "d02e2fd1d02e3fc1",
    type: "organization"
  },
  {
    filename: "S15_2239.png",
    phash: "d0692f9694696b96",
    type: "organization"
  },
  {
    filename: "S15_2242.png",
    phash: "bb96d4696b1e3481",
    type: "organization"
  },
  {
    filename: "S15_2243.png",
    phash: "8ff0f00f20a01fdf",
    type: "organization"
  },
  {
    filename: "S15_2245.png",
    phash: "b1cdcf326c91306d",
    type: "organization"
  },
  {
    filename: "S15_2246.png",
    phash: "9149e6b61d4961de",
    type: "organization"
  },
  {
    filename: "S15_2250.png",
    phash: "e7e0984fd0b66790",
    type: "organization"
  },
  {
    filename: "S15_2253.png",
    phash: "eda19293656d9296",
    type: "organization"
  },
  {
    filename: "S15_2255.png",
    phash: "ba3794c8c13c3e95",
    type: "organization"
  },
  {
    filename: "S15_2257.png",
    phash: "af49c0c59f368cc9",
    type: "organization"
  },
  {
    filename: "S15_2259.png",
    phash: "ca48b7bb14b44b4b",
    type: "organization"
  },
  {
    filename: "S15_2260.png",
    phash: "b898c76768989667",
    type: "organization"
  },
  {
    filename: "S8_870.png",
    phash: "b2b3894c66b33b4c",
    type: "organization"
  },
  {
    filename: "S9_1145.png",
    phash: "d3792c8693696c96",
    type: "organization"
  },
  {
    filename: "bilar99.png",
    phash: "be98c067c7c3193c",
    type: "organization"
  },
  {
    filename: "broman.png",
    phash: "e36b9c90b44d4b33",
    type: "organization"
  },
  {
    filename: "decens.png",
    phash: "c1c33e7cc1c374a5",
    type: "organization"
  },
  {
    filename: "erillisverkot-org.png",
    phash: "d0c52f3ad0c52f3a",
    type: "organization"
  },
  {
    filename: "etteplan.png",
    phash: "d0d407837a5adf25",
    type: "organization"
  },
  {
    filename: "fraidei.png",
    phash: "eb0f94f06b0f90f0",
    type: "organization"
  },
  {
    filename: "gim-robotics.png",
    phash: "f80707fdbc80701f",
    type: "organization"
  },
  {
    filename: "hsl_org.png",
    phash: "943e6b6994966b68",
    type: "organization"
  },
  {
    filename: "istekki.png",
    phash: "ba92c56d3a92946d",
    type: "organization"
  },
  {
    filename: "joki_ict.jpg",
    phash: "ec7893876c5c91a3",
    type: "organization"
  },
  {
    filename: "neliot-liikkuu.jpeg",
    phash: "c3c43439dac6e761",
    type: "organization"
  },
  {
    filename: "nologo.png",
    phash: "c163141e6bd36e65",
    type: "organization"
  },
  {
    filename: "oulu.jpg",
    phash: "b165cfc6861c9c1b",
    type: "organization"
  },
  {
    filename: "pp-ruoka.jpg",
    phash: "c5c61e69699b30c7",
    type: "organization"
  },
  {
    filename: "probis_solutions_oy_logo.jpeg",
    phash: "afe6c08d916b921d",
    type: "organization"
  },
  {
    filename: "produal.png",
    phash: "db9c6cc3923cc949",
    type: "organization"
  },
  {
    filename: "ropo.png",
    phash: "d1e02e1f95e0699e",
    type: "organization"
  },
  {
    filename: "sanoma.png",
    phash: "c0c13f3ec0c13f3e",
    type: "organization"
  },
  {
    filename: "serviceform.jpg",
    phash: "cdb0364f5bd88427",
    type: "organization"
  },
  {
    filename: "sevendos_org.png",
    phash: "ef2b90c46f3b90c4",
    type: "organization"
  },
  {
    filename: "sweco.jpg",
    phash: "eaca85357acac135",
    type: "organization"
  },
  {
    filename: "talokaivo.png",
    phash: "bf9cc0622f9dd062",
    type: "organization"
  },
  {
    filename: "tietoevry.png",
    phash: "eb2194da6b2594da",
    type: "organization"
  }
];

export async function up(knex: Knex): Promise<void> {
  const mappings = EMBEDDED_MAPPINGS;

  // Create lookup maps (filename → phash)
  const teamMappings = new Map<string, string>();
  const orgMappings = new Map<string, string>();

  mappings.forEach((m) => {
    if (m.type === "team") {
      teamMappings.set(m.filename, m.phash);
    } else if (m.type === "organization") {
      orgMappings.set(m.filename, m.phash);
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
    // Look up phash by filename
    const phash = teamMappings.get(team.team_logo);

    if (phash) {
      await knex("Teams").where("id", team.id).update({ team_logo: phash });
      teamsUpdated++;
    } else {
      console.warn(
        `No phash mapping found for team logo: ${team.team_logo} (team ID: ${team.id})`
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
    // Look up phash by filename
    const phash = orgMappings.get(org.logo);

    if (phash) {
      await knex("Organizations").where("id", org.id).update({ logo: phash });
      orgsUpdated++;
    } else {
      console.warn(
        `No phash mapping found for org logo: ${org.logo} (org ID: ${org.id})`
      );
      orgsSkipped++;
    }
  }

  console.warn(
    `Updated ${orgsUpdated} organization logos, ${orgsSkipped} skipped (no mapping found)`
  );
}

export async function down(knex: Knex): Promise<void> {
  const mappings = EMBEDDED_MAPPINGS;

  // Create reverse lookup maps (phash → filename)
  const teamMappings = new Map<string, string>();
  const orgMappings = new Map<string, string>();

  mappings.forEach((m) => {
    if (m.type === "team") {
      teamMappings.set(m.phash, m.filename);
    } else if (m.type === "organization") {
      orgMappings.set(m.phash, m.filename);
    }
  });

  console.warn(
    `Loaded ${teamMappings.size} team reverse mappings and ${orgMappings.size} organization reverse mappings`
  );

  // Update Teams table - convert phash back to filename
  const teams = await knex("Teams").select("id", "team_logo");
  let teamsUpdated = 0;
  let teamsSkipped = 0;

  for (const team of teams) {
    const filename = teamMappings.get(team.team_logo);
    if (filename) {
      await knex("Teams").where("id", team.id).update({ team_logo: filename });
      teamsUpdated++;
    } else {
      console.warn(
        `No filename mapping found for team logo phash: ${team.team_logo} (team ID: ${team.id})`
      );
      teamsSkipped++;
    }
  }

  console.warn(
    `Reverted ${teamsUpdated} team logos, ${teamsSkipped} skipped (no mapping found)`
  );

  // Update Organizations table - convert phash back to filename
  const orgs = await knex("Organizations").select("id", "logo");
  let orgsUpdated = 0;
  let orgsSkipped = 0;

  for (const org of orgs) {
    const filename = orgMappings.get(org.logo);
    if (filename) {
      await knex("Organizations")
        .where("id", org.id)
        .update({ logo: filename });
      orgsUpdated++;
    } else {
      console.warn(
        `No filename mapping found for org logo phash: ${org.logo} (org ID: ${org.id})`
      );
      orgsSkipped++;
    }
  }

  console.warn(
    `Reverted ${orgsUpdated} organization logos, ${orgsSkipped} skipped (no mapping found)`
  );
}
