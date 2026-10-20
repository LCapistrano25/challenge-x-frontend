import { Button } from "../../../shared/ui/Button";
import "./UiPlayground.css";

export function UiPlayground() {
  return (
    <main className="ui-playground">
      <h1>Button</h1>

      <section className="ui-playground__section">
        <h2>Variantes</h2>
        <div className="ui-playground__row">
          <Button>Salvar</Button>
          <Button variant="secondary">Cancelar</Button>
          <Button variant="danger">Excluir</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </section>

      <section className="ui-playground__section">
        <h2>Tamanhos</h2>
        <div className="ui-playground__row">
          <Button size="small">Pequeno</Button>
          <Button size="medium">Médio</Button>
          <Button size="large">Grande</Button>
        </div>
      </section>

      <section className="ui-playground__section">
        <h2>Estados</h2>
        <div className="ui-playground__row">
            <Button disabled>Desabilitado</Button>
            <Button variant="secondary" disabled>Desabilitado</Button>
            <Button variant="danger" disabled>Desabilitado</Button>
        </div>
        
      </section>
    </main>
  );
}
