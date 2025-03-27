import { fetchRelease } from "../api/jira";
import { postToSlack } from "../api/slack";

export const handleDeploy = async (releasedDate: string, channel: string) => {
  const releaseInfo: {
    versions: string[];
    links: { [x: string]: string[] }[];
  } | null = await fetchRelease(releasedDate);

  if (releaseInfo && releaseInfo.versions.length > 0) {
    await postToSlack(
      channel,
      `🚀 *${releasedDate} 배포 정보를 알려드려요*`,
      releaseInfo
    );
  } else {
    await postToSlack(
      channel,
      `⚠️ 요청하신 날짜(${releasedDate})에 대한 릴리즈 정보가 없습니다.`
    );
  }
};

/**
 * releaseInfo :
 * [{PC : ['1', '2', '3']}, {TV: ['4', '5', '6']}]
 *
 *
 */
