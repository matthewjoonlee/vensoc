export function toSafeRelativePath(path: string | null): string {
  if (!path || !path.startsWith("/")) {
    return "/";
  }

  if (path.startsWith("//")) {
    return "/";
  }

  return path;
}
