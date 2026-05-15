import { Building2, Globe, MapPin } from "lucide-react";
import PropTypes from "prop-types";
import dayjs from "dayjs";

import { Avatar, AvatarImage } from "./ui/avatar";
import { githubRepoShape, githubUserShape, nullableStringProp } from "../utils/githubUser";

const EMPTY_BIO_TEXT = "This Profile has no bio.";

const StatBlock = ({ name, stat }) => (
  <div className="text-center sm:text-left">
    <h3 className="mb-1 text-xs font-base text-foreground/60 uppercase tracking-wider">{name}</h3>
    <p className="text-lg font-heading text-foreground sm:text-2xl">{stat}</p>
  </div>
);

const UserGithubStats = ({ repos, followers, following }) => (
  <div className="flex justify-between gap-2 rounded-base border-2 border-border bg-main p-4 shadow-shadow">
    <StatBlock name="Repos" stat={repos} />
    <StatBlock name="Followers" stat={followers} />
    <StatBlock name="Following" stat={following} />
  </div>
);

const InfoRow = ({ text, type, icon: Icon }) => {
  const available = Boolean(text);
  const content = !text ? (
    "Not Available"
  ) : type === "link" ? (
    <a
      href={text}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2 hover:text-main transition-colors"
    >
      {text}
    </a>
  ) : (
    text
  );

  return (
    <p
      className="flex items-center gap-3 text-sm font-base"
      style={{ opacity: available ? 1 : 0.5 }}
    >
      {Icon && <Icon className="size-5 shrink-0" />}
      {content}
    </p>
  );
};

const UserInformation = ({ location, blog, company }) => (
  <div className="mt-4 grid gap-4">
    <div className="grid gap-4 sm:grid-cols-2">
      <InfoRow text={location} type="text" icon={MapPin} />
      <InfoRow text={company} type="text" icon={Building2} />
    </div>
    <InfoRow text={blog} type="link" icon={Globe} />
  </div>
);

const RecentRepos = ({ repos }) => {
  if (!repos.length) {
    return null;
  }

  return (
    <section className="mt-6">
      <h3 className="mb-3 text-xs font-heading text-foreground/60 uppercase tracking-wider">
        Recent Repositories
      </h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {repos.map((repo) => (
          <a
            key={repo.id}
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-base border-2 border-border bg-main p-3 shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
          >
            <p className="text-sm font-heading text-main-foreground truncate">{repo.name}</p>
            <p className="mt-1 text-xs font-base text-main-foreground/70">
              {dayjs(repo.pushed_at).format("DD MMM YYYY")}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
};

export const Display = ({ data }) => {
  const bioText = data.bio || EMPTY_BIO_TEXT;

  return (
    <section className="mt-4 rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow sm:p-8">
      <div className="grid grid-cols-[auto_1fr] gap-4 sm:gap-6">
        <Avatar className="size-20 sm:size-24 row-span-1">
          <AvatarImage src={data.avatar_url} alt="User Profile" />
        </Avatar>
        <div className="flex flex-col justify-center">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <h2 className="text-xl font-heading text-foreground sm:text-2xl leading-tight">
              {data.name || data.login}
            </h2>
            <p className="text-xs font-base text-foreground/50">
              Joined {dayjs(data.created_at).format("MMMM YYYY")}
            </p>
          </div>
          <a
            href={data.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-base text-main underline underline-offset-2 hover:text-main/80 transition-colors"
          >
            @{data.login}
          </a>
        </div>
      </div>

      <p className="mt-4 leading-relaxed text-foreground/80 font-base text-sm">{bioText}</p>

      <div className="mt-4">
        <UserGithubStats
          repos={data.public_repos}
          followers={data.followers}
          following={data.following}
        />
      </div>

      <UserInformation location={data.location} blog={data.blog} company={data.company} />
      <RecentRepos repos={data.recent_repos} />
    </section>
  );
};

StatBlock.propTypes = {
  name: PropTypes.string.isRequired,
  stat: PropTypes.number.isRequired,
};

UserGithubStats.propTypes = {
  repos: PropTypes.number.isRequired,
  followers: PropTypes.number.isRequired,
  following: PropTypes.number.isRequired,
};

InfoRow.propTypes = {
  text: nullableStringProp,
  type: PropTypes.oneOf(["text", "link"]).isRequired,
  icon: PropTypes.elementType,
};

UserInformation.propTypes = {
  location: nullableStringProp,
  blog: nullableStringProp,
  company: nullableStringProp,
};

RecentRepos.propTypes = {
  repos: PropTypes.arrayOf(githubRepoShape).isRequired,
};

Display.propTypes = {
  data: githubUserShape.isRequired,
};
