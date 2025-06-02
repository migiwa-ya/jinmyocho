import { MouseEvent, useState } from "hono/jsx";

type CheckGpsInterceptorProps = {
  children: (
    intercept: (
      originalOnClick?: (e: MouseEvent) => void
    ) => (e: MouseEvent) => void
  ) => any;
  // ) => JSXNode;
};

const CheckGpsInterceptor = ({ children }: CheckGpsInterceptorProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const intercept = (originalOnClick?: (e: MouseEvent) => void) => {
    return (e: MouseEvent) => {
      e.preventDefault();
      if (!navigator.geolocation) {
        setIsModalOpen(true);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        () => {
          originalOnClick?.(e);
        },
        () => {
          setIsModalOpen(true);
        }
      );
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
