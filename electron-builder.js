export default {
  appId: "com.lordtocs.castmate",
  productName: "CastMate",
  asar: true,
  directories: {
    "output": "release/${version}"
  },
  files: [
    "dist"
  ],
  mac: {
    artifactName: "${productName}_${version}.${ext}",
    target: [
      "dmg"
    ]
  },
  win: {
    target: [
      {
        target: "nsis",
        arch: [
          "x64"
        ]
      }
    ],
    artifactName: "${productName}_${version}.${ext}"
  },
  nsis: {
    "oneClick": false,
    "perMachine": false,
    "allowToChangeInstallationDirectory": true,
    "deleteAppDataOnUninstall": true
  },
  extraResources: [
    {
      "from": "node_modules/regedit/vbs",
      "to": "regedit/vbs",
      "filter": [
        "**/*"
      ]
    }
  ],
  extraFiles: [
    {
      from: "web",
      to: "web",
    }
  ],
  publish: [{
    provider: 'github',
    owner: "LordTocs",
    repo: "CastMate"
  }],
}