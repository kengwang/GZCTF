<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/banner.dark.svg">
  <img alt="Banner" src="assets/banner.light.svg">
</picture>

# GZ::CTF

[![publish](https://github.com/GZTimeWalker/GZCTF/actions/workflows/ci.yml/badge.svg)](https://github.com/GZTimeWalker/GZCTF/actions/workflows/ci.yml)
![version](https://img.shields.io/github/v/release/GZTimeWalker/GZCTF?include_prereleases&label=version)
![license](https://img.shields.io/github/license/GZTimeWalker/GZCTF?color=FF5531)
[![Crowdin](https://badges.crowdin.net/gzctf/localized.svg)](https://crowdin.com/project/gzctf)

[![Telegram Group](https://img.shields.io/endpoint?color=blue&url=https%3A%2F%2Ftg.sumanjay.workers.dev%2Fgzctf)](https://telegram.dog/gzctf)
[![QQ Group](https://img.shields.io/badge/QQ%20Group-903244818-blue)](https://jq.qq.com/?_wv=1027&k=muSqhF9x)
[![Discord](https://img.shields.io/discord/1239476909033656320?label=Discord)](https://discord.gg/dV9A6ZjVhC)

[English](./README.md), [简体中文](./README.zh.md), [日本語](./README.ja.md)

---

Modified from [GZCTF](https://github.com/GZTimeWalker/GZCTF)

The following new features have been added:

* Allows submissions during the competition that do not count towards scoring
* Allows multiple organizations to join via (or without) invitation code
* Optimized scoreboard display (portrait mode, show affiliated organizations)
* Allows administrators to modify organization of specific team
* Search for challenges on the challenges page (regex)
* Scoreboard filters out non-public.
* Monitoring page hides Flag (for live streaming)
* Scheduled challenge availability
* Fake Flags (organizers set specified Flags, participants can submit them with correct message but counted as cheating in backend)
* Custom icons for problem-solving status
* Scoreboard export with username

We are open to modification suggestions and welcome Issues or PRs.

How to migrate to `kengwang/GZCTF`:

Replace the `image` in `compose.yml` with:

```
registry.cn-hangzhou.aliyuncs.com/kengwang/gzctf/gzctf
```

> [!WARNING]  
> Please note that due to changes in the database structure, if you have previously used the original GZCTF, you will need to run the following SQL command after migration:

```sql
UPDATE "Games" SET "Organizations" = '{}';
```

---


GZ::CTF is an open source CTF platform based on ASP.NET Core.

> [!IMPORTANT]
> **To save your effort, please read the documentation carefully before using: [https://docs.ctf.gzti.me/en](https://docs.ctf.gzti.me/en)**

> [!WARNING]
> Since 01/01/2024, the database structure of the `develop` image is no longer compatible with previous versions. If you prefer to use it, please go to `v0.17`.
>
> During the rapid development of new features, it is not recommended to use the `develop` image for production deployment, and the database structure changes will cause data loss.

## Features 🛠️

- Create highly customizable challenges

  - Type of challenges: Static Attachment, Dynamic Attachment, Static Container, Dynamic Container

    - Static Attachment: Shared attachments, any configured flag can be accepted.
    - Dynamic Attachment: The number of flags and attachments must be at least the number of teams. Attachments and flags are distributed according to the teams.
    - Static Container: Shared container templates, no dynamic flag is issued, and any configured flag can be submitted.
    - Dynamic Container: Automatically generate and issue flags through container environment variables, and flag of each team is unique.

  - Dynamic Scores

    - Curve of scores:

      $$f(S, r, d, x) = \left \lfloor S \times \left[r  + ( 1- r) \times \exp\left( \dfrac{1 - x}{d} \right) \right] \right \rfloor $$

      Where $S$ is the original score, $r$ is the minimum score ratio, $d$ is the difficulty coefficient, and $x$ is the number of submissions. The first three parameters can be customized to satisfy most of the dynamic score requirements.

    - Bonus for first three solves:
      The platform rewards 5%, 3%, and 1% of the current score for the first three solves respectively.

  - Disable or enable challenges during the competition, and release new challenges at any time.
  - Dynamic flag sharing detection, optional flag template, leet flag

- **Teams** score timeline, scoreboard. Teams can be grouped
- Dynamic container distribution, management, and multiple port mapping methods based on **Docker or K8s**
- **Real-time** competition notification, competition events and flag submission monitoring, and log monitoring based on SignalR
- SMTP email verification, malicious registration protection based on Google ReCaptchav3
- Ban specific user, three-level user permission management
- Optional team review, invitation code, registration email restriction
- Writeup collection, review, and batch download in the platform
- Download exported scoreboard, export all submission records
- Monitor submissions and major event logs during the competition
- Challenges traffic forwarding based on **TCP over WebSocket proxy**, configurable traffic capture
- Cluster cache based on Redis, database storage backend based on PGSQL
- Customizable global configuration, platform title, record information
- Support metrics and distributed tracing
- And more...

## Demo 🗿

![index.webp](docs/public/images/index.webp)
![game.challenges.webp](docs/public/images/game.challenges.webp)
![game.scoreboard.webp](docs/public/images/game.scoreboard.webp)
![admin.settings.webp](docs/public/images/admin.settings.webp)
![admin.challenges.webp](docs/public/images/admin.challenges.webp)
![admin.challenge.info.webp](docs/public/images/admin.challenge.info.webp)
![admin.challenge.flags.webp](docs/public/images/admin.challenge.flags.webp)
![admin.game.info.webp](docs/public/images/admin.game.info.webp)
![admin.game.review.webp](docs/public/images/admin.game.review.webp)
![admin.teams.webp](docs/public/images/admin.teams.webp)
![admin.instances.webp](docs/public/images/admin.instances.webp)
![monitor.game.events.webp](docs/public/images/monitor.game.events.webp)
![monitor.game.submissions.webp](docs/public/images/monitor.game.submissions.webp)

## About i18n 🌐

Localization support is in progress, please refer to [translate.ctf.gzti.me](https://translate.ctf.gzti.me) to learn more or participate in the translation work.

## Contributors 👋

<a href="https://github.com/GZTimeWalker/GZCTF/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=GZTimeWalker/GZCTF" />
</a>

## CTF hosted with GZ::CTF 🏆

Some event organizers have already chosen GZCTF and successfully completed their competitions. Their trust, support, and timely feedback are the primary driving force behind the continuous improvement of GZCTF.

- **THUCTF 2022: Tsinghua University Network Security Technology Challenge**
- **ZJUCTF 2022/2023: Zhejiang University CTF**
- **SUSCTF 2022/2023: Southeast University Tiger Crouching, Dragon Coiling Cup Network Security Challenge**
- **DIDCTF 2022/2023: Gansu Political and Legal University CTF**
- **Woodpecker: The First Network Security Practice Competition of Shandong University of Science and Technology**
- **NPUCTF 2022: Northwestern Polytechnical University CTF**
- **SkyNICO Network Space Security Tri-school Competition (Xiamen University of Technology, Fujian Normal University, Qilu University of Technology)**
- **Hunan Police Academy Network Security Attack and Defense Competition**
- **W4terCTF 2023: The First Information Security Novice Competition of Sun Yat-sen University**
- **TongjiCTF 2023: The Fifth Network Security Competition of Tongji University**
- **CTBUCTF 2023: The First Network Security Competition of Chongqing Technology and Business University**
- **NPUCTF 2023 - The First Security Experimental Skills Competition of Northwestern Polytechnical University**
- **XZCTF 2023: The First Network Security Novice Competition of Zhejiang Normal University Xingzhi College**
- **ORGCTF 2023: Gongcheng Cup Freshman Competition of Harbin Engineering University**
- **SHCTF 2023: "Shanhe" Network Security Skills Challenge**
- **Tianjin University of Science and Technology 2023 College Student Maker Training Camp Network Security Group Selection**
- **HYNUCTF 2023: Xuantian Network Security Laboratory Recruitment Competition of Hunan Hengyang Normal University**
- **NYNUCTF S4: Recruitment Competition of Xuantian Network Security Laboratory of Nanyang Normal University**
- **The First Network Security Freshman Challenge of Shangqiu Normal University**
- **SVUCTF-WINTER-2023: Suzhou Vocational University 2023 Winter Freshman Competition**
- **BIEM CTF 2024：Beijing Institute Of Economics And Management - The first BIEM "Xin'an Cup" CTF competition**
- **BUAACTF 2024: Beihang University CTF**
- **San Diego CTF 2024: University of California, San Diego**
- **The first "Qu STAR" network security skills competition of Qufu Normal University**

_The list is not in any particular order, and PRs are welcome for additions._

## Special Thanks ❤️‍🔥

Thanks to NanoApe, the organizer of THUCTF 2022, for providing sponsorship and conducting Alibaba Cloud public network stress testing. This helped validate the service stability of the GZCTF standalone instance (16c90g) under the pressure of thousands of concurrent requests and 1.34 million requests in three minutes.

## Stars ✨

[![Stargazers over time](https://starchart.cc/GZTimeWalker/GZCTF.svg?variant=adaptive)](https://starchart.cc/GZTimeWalker/GZCTF)
