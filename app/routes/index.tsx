import { createRoute } from "honox/factory";

export default createRoute((c) => {
  const name = "神名帳 (β版)";

  return c.render(
    <>
      <title>{name}</title>

      <div class="py-8">
        <h1 class="text-3xl font-bold text-center">{name}</h1>

        <section class="max-w-4xl m-auto text-gray-700 p-4 leading-8 space-y-2">
          <p>
            {name}
            は、日本各地の神社に関する情報を整理し、誰でも自由に学び、探し、活用できることを目指して作られた
            <strong>神社情報アーカイブ</strong>です。
          </p>
          <p>
            <strong>
              現在、掲載している情報はまだ整備途中であり、不足や誤りが含まれている場合があります
            </strong>
            。正確で透明性の高い情報提供を目指して、今後も継続的に内容の拡充と訂正を行ってまいります。
          </p>
          <p>
            <strong>多くの方のご利用・ご協力をお待ちしております！</strong>
          </p>

          <p class="text-right mt-4">
            詳しくは{" "}
            <a
              class="inline-block mt-2 text-blue-600 hover:text-blue-800 underline"
              href="/about"
            >
              「{name}について」
            </a>
            をご確認ください。
          </p>

        </section>
      </div>
    </>
  );
});
