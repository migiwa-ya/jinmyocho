import { createRoute } from "honox/factory";

export default createRoute((c) => {
  return c.render(
    <div class="max-w-lg mx-auto p-6">
      <div class="mb-6 max-h-64 overflow-y-auto space-y-2 p-2">
        <a
          class="p-4 bg-gray-100 rounded-md hover:bg-gray-200 flex items-center justify-between"
          href="/dashboard/images"
        >
          画像一覧
        </a>
        <a
          class="p-4 bg-gray-100 rounded-md hover:bg-gray-200 flex items-center justify-between"
          href="/dashboard/images/upload"
        >
          画像アップロード
        </a>
      </div>
    </div>
  );
});
