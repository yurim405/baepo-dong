import axios from "axios";
import {
  JIRA_BASE_URL,
  JIRA_USER,
  JIRA_API_TOKEN,
  JIRA_PROJECT_ID,
} from "../config";

/**
 * 배포 일자 기준으로 버전 아이디 조회
 * @param releasedDate
 * @returns
 */
const fetchVersionIdByName = async (releasedDate: string) => {
  // 릴리즈 전체 버전 조회
  const releaseList = await axios.get(
    `${JIRA_BASE_URL}/rest/api/3/project/${JIRA_PROJECT_ID}/versions`,
    {
      auth: {
        username: JIRA_USER,
        password: JIRA_API_TOKEN,
      },
    }
  );

  const versions = releaseList.data.filter(
    (v: any) =>
      v.releaseDate === releasedDate && v.name.includes("Web") && !v.released
  );

  return versions.map((v: any) => ({ id: v.id, name: v.name }));
};

export const fetchRelease = async (version: string) => {
  // 상세 조회 할 버전 정보
  const versions = await fetchVersionIdByName(version);

  if (versions.length === 0) {
    return null;
  }

  const requests = versions.map(({ id, name }: { id: string; name: string }) =>
    axios.get(`${JIRA_BASE_URL}/rest/api/3/search?jql=fixVersion=${id}`, {
      auth: {
        username: JIRA_USER,
        password: JIRA_API_TOKEN,
      },
    })
  );

  const results = await Promise.allSettled(requests);

  const issues = results.map((result, index) => {
    if (result.status === "fulfilled") {
      return {
        [versions[index].name]: result.value.data.issues,
      };
    }

    return [];
  });

  const addedParentIds = new Set<string>();

  /**
   * issues : [{'25.11.01 PC': [{issue1}, {issue2}, {issue3}]},
   * {'25.11.01 TV': [{issue4}, {issue5}, {issue6}]},
   * {'25.11.01 Account': []}
   * ]
   */

  const links = issues.map((issueByPoc: any) => {
    const releaseKey: string = Object.keys(issueByPoc)[0];

    const releaseIssuesLink = issueByPoc[releaseKey]
      .filter((issue: any) => {
        const parentIssueId = issue.fields?.parent?.id;

        if (parentIssueId) {
          if (addedParentIds.has(parentIssueId)) {
            // @TODO 중복 방지로 해놓았는데 임시로 false처리
            return true;
            // return false;
          }

          addedParentIds.add(parentIssueId);

          return true;
        } else {
          return true;
        }
      })
      .map((issue: any) => {
        return `<${JIRA_BASE_URL}/browse/${issue.key}|[${issue.key}]> : ${issue.fields?.summary}`;
      });

    return { [releaseKey]: releaseIssuesLink };
  });

  return {
    versions,
    links,
  };
};
