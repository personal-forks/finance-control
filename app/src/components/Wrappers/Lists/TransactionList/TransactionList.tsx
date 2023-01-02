import React, { FunctionComponent } from 'react';

import { ArrowRight } from '@mui/icons-material';
import { Box } from '@mui/material';
import { flatten, get, head, omit } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { TransactionListProps } from './types';

import {
  Amount,
  Chip,
  Date,
  LoadingButton,
  Row,
  SourceDestination,
  Txid,
} from '@numaryhq/storybook';

import {
  getLedgerAccountDetailsRoute,
  getLedgerTransactionDetailsRoute,
  getRoute,
  TRANSACTIONS_ROUTE,
} from '~/src/components/Navbar/routes';
import Table from '~/src/components/Wrappers/Table';
import { Cursor } from '~/src/types/generic';
import {
  PostingHybrid,
  Transaction,
  TransactionHybrid,
} from '~/src/types/ledger';
import { SearchPolicies, SearchTargets } from '~/src/types/search';

export const displayTxid = (
  data: TransactionHybrid[] | PostingHybrid[],
  item: TransactionHybrid | PostingHybrid
): boolean => {
  const groupedByTxid = data.filter(
    (a: TransactionHybrid | PostingHybrid) => a.txid === item.txid
  );
  const first = head(groupedByTxid) as TransactionHybrid;

  return (
    first.destination === item.destination &&
    first.source === item.source &&
    first.txid === item.txid
  );
};

const normalize = (cursor: Cursor<Transaction>): Cursor<Transaction> =>
  ({
    ...cursor,
    data: flatten(
      get(cursor, 'data', []).map((transaction: Transaction) =>
        get(transaction, 'postings', []).map((posting, index) => ({
          ...posting,
          postingId: index,
          ...omit(transaction, 'postings'),
        }))
      )
    ),
  } as unknown as Cursor<Transaction>);

const TransactionList: FunctionComponent<TransactionListProps> = ({
  transactions,
  withPagination,
  paginationSize = 15,
  showMore = false,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const transactionsNormalized = normalize(transactions);
  const { accountId } = useParams<{
    accountId: string;
  }>();

  const handleAction = (transaction: TransactionHybrid) =>
    navigate(
      getLedgerTransactionDetailsRoute(transaction.txid, transaction.ledger)
    );

  const handleSourceDestinationAction = (id: string, ledger: string) => {
    navigate(getLedgerAccountDetailsRoute(id, ledger));
  };

  const handleShowMore = () =>
    navigate(
      `${getRoute(
        TRANSACTIONS_ROUTE
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      )}?terms=${`destination=${accountId!}`}&terms=${`source=${accountId!}`}&target=${
        SearchTargets.TRANSACTION
      }&policy=${SearchPolicies.OR}&size=15`
    );

  const renderRowActions = (transaction: TransactionHybrid) => (
    <Box key={transaction.txid} component="span">
      <LoadingButton
        id={`show-${transaction.txid}`}
        onClick={() => handleAction(transaction)}
        endIcon={<ArrowRight />}
      />
    </Box>
  );

  return (
    <>
      <Table
        withPagination={withPagination}
        paginationSize={paginationSize}
        items={transactionsNormalized}
        action
        columns={[
          {
            key: 'txid',
            label: t('pages.transactions.table.columnLabel.txid'),
            sort: true,
            width: 5,
          },
          {
            key: 'value',
            label: t('pages.transactions.table.columnLabel.value'),
            width: 5,
          },
          {
            key: 'source',
            label: t('pages.transactions.table.columnLabel.source'),
            width: 30,
          },
          {
            key: 'destination',
            label: t('pages.transactions.table.columnLabel.destination'),
            width: 30,
          },
          {
            key: 'ledger',
            label: t('pages.transactions.table.columnLabel.ledger'),
            width: 5,
          },
          {
            key: 'timestamp',
            label: t('pages.transactions.table.columnLabel.date'),
            sort: true,
            width: 5,
          },
        ]}
        renderItem={(
          transaction: TransactionHybrid,
          index: number,
          data: TransactionHybrid[]
        ) => {
          const displayElement = displayTxid(data, transaction);

          return (
            <Row
              key={index}
              keys={[
                displayElement ? (
                  <Txid id={transaction.txid} key={transaction.txid} />
                ) : (
                  <></>
                ),
                <Amount
                  asset={transaction.asset}
                  key={transaction.txid}
                  amount={transaction.amount}
                />,
                <SourceDestination
                  key={transaction.txid}
                  label={transaction.source}
                  color="blue"
                  onClick={() =>
                    handleSourceDestinationAction(
                      transaction.source,
                      transaction.ledger
                    )
                  }
                />,
                <SourceDestination
                  key={transaction.txid}
                  label={transaction.destination}
                  color="blue"
                  onClick={() =>
                    handleSourceDestinationAction(
                      transaction.destination,
                      transaction.ledger
                    )
                  }
                />,
                <Chip
                  key={index}
                  label={transaction.ledger}
                  variant="square"
                  color="brown"
                />,
                <Date
                  key={transaction.txid}
                  timestamp={transaction.timestamp}
                />,
              ]}
              item={transaction}
              renderActions={() => renderRowActions(transaction)}
            />
          );
        }}
      />
      {showMore && (
        <Box display="flex" justifyContent="flex-end" mt={1}>
          <LoadingButton
            id="show-more"
            variant="stroke"
            content={t('common.showMore')}
            onClick={handleShowMore}
          />
        </Box>
      )}
    </>
  );
};

export default TransactionList;
