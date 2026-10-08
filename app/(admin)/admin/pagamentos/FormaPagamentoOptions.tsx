export const FORMA_LABEL: Record<string, string> = {
  indefinida: "Pix, boleto ou cartão",
  pix: "Pix",
  boleto: "Boleto",
  cartao: "Cartão de crédito",
};

export function FormaPagamentoOptions() {
  return (
    <>
      <option value="indefinida">Cliente escolhe (Pix, boleto ou cartão)</option>
      <option value="pix">Só Pix</option>
      <option value="boleto">Só boleto</option>
      <option value="cartao">Só cartão de crédito</option>
    </>
  );
}
