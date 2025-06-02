import { MouseEvent, useState } from "hono/jsx";

type CheckGpsInterceptorProps = {
  children: (
    intercept: (action: (e: MouseEvent) => void) => (e: MouseEvent) => void
  ) => any;
};

const CheckGpsInterceptor = ({ children }: CheckGpsInterceptorProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * Wrap an action to check geolocation permission before executing.
   * If permission is denied, show modal; otherwise proceed with the action.
   */
  const intercept = (action: (e: MouseEvent) => void) => {
    return async (e: MouseEvent) => {
      e.preventDefault();
      if (!navigator.permissions) {
        // permissions API unsupported, proceed and let browser handle consent
        action(e);
        return;
      }
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' });
        if (status.state === 'denied') {
          setIsModalOpen(true);
          return;
        }
      } catch {
        // ignore query errors
      }
      action(e);
    };
  };

  const handleCancel = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(false);
  };

  return (
    <>
      {children(intercept)}

      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ height: "70vh" }}
        >
          <div className="bg-white rounded-lg p-6 shadow-lg w-90">
            <div className="flex items-center">
              位置情報の取得がブロックされています
            </div>

            <div className="flex items-center mt-4">
              <div>
                <p className="text-blue-700 font-semibold mb-2">
                  位置情報の取得を許可してください。
                </p>
                <ul className="list-disc list-inside text-blue-600">
                  <li>
                    <a
                      href="https://support.google.com/chrome/answer/142065?hl=ja&co=GENIE.Platform%3DAndroid&oco=0"
                      className="text-blue-500 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Chrome: 位置情報の有効化方法
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://support.apple.com/ja-jp/guide/personal-safety/ips9bf20ad2f/1.0/web/1.0#ips2209db383"
                      className="text-blue-500 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Safari: 位置情報の有効化方法
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCancel}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CheckGpsInterceptor;
