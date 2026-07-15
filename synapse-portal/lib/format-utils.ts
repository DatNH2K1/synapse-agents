export const formatTagName = (name: string, version?: string | null) => {
  const formattedName = name
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return version ? `${formattedName} v${version}` : formattedName;
};

export const formatFullTag = (
  scope: string,
  name: string,
  version?: string | null,
) => {
  const formattedName = formatTagName(name, version);
  return `[${scope.toUpperCase()}] ${formattedName}`;
};
