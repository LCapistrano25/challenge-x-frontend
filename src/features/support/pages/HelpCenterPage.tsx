import { useId, useMemo, useState, type ComponentType, type SVGProps } from 'react';
import { usePageHeader } from '@/shared/lib/page-header';
import { Button, EmptyState, Input } from '@/shared/ui';
import { ContactDialog } from '../components/ContactDialog';
import {
  IconConversation,
  IconHelpBubble,
  IconSearchHelp,
  IconTipCheck,
  IconTipInfo,
  IconTopicProject,
  IconTopicTeam,
} from '../components/icons';
import { FAQ_TOPICS } from '../content/faq';
import { describeFaqSummary, describeTopicCount, filterFaq } from '../lib/help-center';
import type { FaqTopic, FaqTopicId } from '../types';
import styles from '../components/HelpCenter.module.css';

const TOPIC_ICON: Record<FaqTopicId, ComponentType<SVGProps<SVGSVGElement>>> = {
  TEAM: IconTopicTeam,
  PROJECT: IconTopicProject,
};

const CONTACT_TIPS = [
  'Descreva o assunto da sua dúvida.',
  'Informe a equipe ou o projeto.',
  'Se houver um erro, inclua a etapa e a mensagem exibida.',
];

function TopicCard({ topic }: { topic: FaqTopic }) {
  const titleId = useId();
  const Icon = TOPIC_ICON[topic.id];
  return (
    <section className={styles.topic} aria-labelledby={titleId}>
      <div className={styles.topicHeader}>
        <Icon className={styles.topicIcon} />
        <div className={styles.topicTitle}>
          <h3 id={titleId} className={styles.h3}>
            {topic.title}
          </h3>
          <p className={styles.caption}>{describeTopicCount(topic.items.length)}</p>
        </div>
      </div>
      <ul className={styles.questions}>
        {topic.items.map((item) => (
          <li key={item.question} className={styles.question}>
            <h4>{item.question}</h4>
            <p>{item.answer}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Central de dúvidas (task #14, Figma: 03 - Acadêmico › "Dúvidas — Central de ajuda").
 * FAQ por assunto com busca por palavra-chave, "Falar com a organização" e dicas.
 *
 * - Perguntas frequentes: conteúdo estático (content/faq.ts) — sem modelo na API (P-35).
 * - Falar com a organização: POST /api/support/tickets (PROPOSTO, P-06).
 */
export function HelpCenterPage() {
  usePageHeader(
    'Dúvidas / Central de ajuda',
    'Encontre orientações para sua equipe e acompanhe cada etapa do Desafio X.',
  );

  const searchId = useId();
  const [query, setQuery] = useState('');
  const [contactOpen, setContactOpen] = useState(false);
  const topics = useMemo(() => filterFaq(FAQ_TOPICS, query), [query]);
  const searching = query.trim().length > 0;

  return (
    <div className={`page-flush ${styles.page}`}>
      <section className={styles.search} aria-labelledby={`${searchId}-title`}>
        <div className={styles.searchIntro}>
          <span className={styles.iconCircle}>
            <IconHelpBubble />
          </span>
          <div className={styles.searchText}>
            <h2 id={`${searchId}-title`} className={styles.h3}>
              Como podemos ajudar?
            </h2>
            <p className={styles.text}>Consulte as respostas abaixo ou busque um assunto.</p>
          </div>
        </div>
        <div className={styles.searchField} role="search">
          <IconSearchHelp className={styles.searchIcon} />
          <Input
            id={searchId}
            type="search"
            inputSize="large"
            className={styles.searchInput}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por palavra-chave. Ex.: convites, entregas"
            aria-label="Buscar dúvidas"
          />
        </div>
      </section>

      <div className={styles.columns}>
        <section className={styles.faq} aria-labelledby={`${searchId}-faq`}>
          <div className={styles.faqHeader}>
            <h2 id={`${searchId}-faq`} className={styles.h3}>
              Perguntas frequentes
            </h2>
            <p className={styles.text} aria-live="polite">
              {describeFaqSummary(topics)}
            </p>
          </div>

          {topics.length > 0 ? (
            <div className={styles.topics}>
              {topics.map((topic) => (
                <TopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          ) : (
            <div className={styles.noResults}>
              <EmptyState
                title="Nenhuma resposta encontrada"
                description={
                  searching
                    ? `Não encontramos perguntas sobre “${query.trim()}”. Tente outra palavra ou fale com a organização.`
                    : undefined
                }
                action={
                  <Button variant="secondary" onClick={() => setQuery('')}>
                    Limpar busca
                  </Button>
                }
              />
            </div>
          )}
        </section>

        <aside className={styles.support} aria-label="Atendimento">
          <div className={styles.contact}>
            <div className={styles.contactInvite}>
              <span className={styles.iconCircle}>
                <IconConversation />
              </span>
              <div className={styles.contactText}>
                <h2>Ainda precisa de ajuda?</h2>
                <p>
                  Se as respostas não resolverem sua dúvida, fale com a equipe de atendimento do
                  Desafio X.
                </p>
              </div>
              <Button
                size="large"
                fullWidth
                className={styles.action}
                onClick={() => setContactOpen(true)}
              >
                Falar com a organização
              </Button>
            </div>
            <div className={styles.tips}>
              <p className={styles.tipsTitle}>Para facilitar o atendimento</p>
              <ul className={styles.tipList}>
                {CONTACT_TIPS.map((tip) => (
                  <li key={tip} className={styles.tip}>
                    <IconTipCheck />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={styles.reminder}>
            <IconTipInfo />
            <div>
              <p className={styles.reminderTitle}>Fique de olho no painel</p>
              <p>Os prazos e status da sua equipe estão na Home e em Projeto.</p>
            </div>
          </div>
        </aside>
      </div>

      <footer className={styles.footer}>
        <p>Desafio X · Programa de inovação acadêmica</p>
        <p>Central de ajuda · Acadêmico</p>
      </footer>

      <ContactDialog open={contactOpen} onOpenChange={setContactOpen} />
    </div>
  );
}
