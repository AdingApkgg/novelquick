export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center text-center">
      <div>
        <h1 className="text-2xl font-bold">403 · 无权限</h1>
        <p className="mt-2 text-muted-foreground">该账号不属于管理员组</p>
      </div>
    </div>
  );
}
