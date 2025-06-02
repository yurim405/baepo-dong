import axios from "axios";
import { JIRA_PROJECT_ID, SLACK_BOT_TOKEN, JIRA_BASE_URL } from "../config";

export const postToSlack = async (
  channel: string,
  text: string,
  releaseInfo?: {
    versions: { id: string; name: string }[];
    links: { [x: string]: string[] }[];
  }
) => {
  /**
   * 2025-03-16 배포 정보를 알려드려요
   */
  const response = await axios.post(
    "https://slack.com/api/chat.postMessage",
    {
      channel,
      text,
    },
    {
      headers: {
        Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  const threadTs = response.data.ts; // 메시지의 타임스탬프 값

  /**
   * [@todo] 브랜치 명 생성 로직 수정 - 하위 이슈 없는 경우 브랜치명 생성 시 id 빼기
   * @param versions
   * @returns
   */
  const generateReleaseBranchName = (
    versions: { id: string; name: string }[]
  ) => {
    console.log(versions);
    const sortedIssueNumbers = versions.sort(
      (a: { id: string; name: string }, b: { id: string; name: string }) => {
        if (a.id === null && b.id === null) return 0;
        if (a.id === null) return 1;
        if (b.id === null) return -1;
        return parseInt(a.id) - parseInt(b.id);
      }
    );

    return `release/${sortedIssueNumbers.join("-")}`;
  };

  await axios.post(
    "https://slack.com/api/chat.postMessage",
    {
      channel,
      text: `*🌳 추천 브랜치명* : ${generateReleaseBranchName(
        releaseInfo?.versions || []
      )}`,
      thread_ts: threadTs, // 쓰레드에 연결
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*🌳 추천 브랜치명* : \`${generateReleaseBranchName(
              releaseInfo?.versions || []
            )}\``,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "release 브랜치 생성하기",
              },
              url: "https://github.com/TvingCorp/web/branches",
              action_id: "create_release_branch",
            },
          ],
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  const categoryMap = {
    "PC Web": "PC",
    "TV Web": "TV",
    "Bill Web": "Bill",
    "Account Web": "Account",
  };

  /**
   * 플랫폼 별 배포 항목 포맷팅
   */
  const formattedOutput = releaseInfo?.links
    .map((entry: { [s: string]: string[] } | ArrayLike<string>) => {
      const [key, items] = Object.entries(entry)[0];
      // const category = Object.keys(categoryMap).find((k) => key.includes(k));

      const versionId = releaseInfo.versions.find((v) => v.name === key)?.id;

      const title = `🔖 ${key} (<${JIRA_BASE_URL}/projects/${JIRA_PROJECT_ID}/versions/${versionId}|${versionId}>)`;

      return `*${title}*${
        items.length
          ? "\n  " + items.map((i: string) => `- ${i}`).join("\n  ") + "\n  "
          : "\n  - ❌ 배포 항목이 없습니다." + "\n  "
      }`;
    })
    .join("\n\n");

  await axios.post(
    "https://slack.com/api/chat.postMessage",
    {
      channel,
      text: formattedOutput,
      thread_ts: threadTs, // 쓰레드에 연결
    },
    {
      headers: {
        Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
};

/**
 * releaseInfo :
 * [{PC : ['1', '2', '3']}, {TV: ['4', '5', '6']}]
 *
 *
 */
