import { useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router';
import {
  Alert,
  Button,
  Card,
  Collapse,
  Descriptions,
  Divider,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  InfoCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';

import { PageHeader } from '@/shared/components';
import { useAuth } from '@/providers';
import { BRAND_ROUTE_MAP } from '@/features/brand/constants';
import { billingService } from '@/shared/modules/billing';

const walletQueryKey = ['billing', 'wallet', 'brand'] as const;

const getParam = (params: URLSearchParams, key: string) => {
  const lower = key.toLowerCase();
  for (const [k, v] of params.entries()) {
    if (k.toLowerCase() === lower) {
      return v;
    }
  }
  return '';
};

const parseResultCode = (raw: string) => {
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
};

const isMoMoSuccess = (code: number | null) => code === 0 || code === 9000;

const formatVnd = (raw: string) => {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return raw || '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n);
};

const formatResponseTime = (raw: string) => {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return raw || '—';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(n));
  } catch {
    return raw;
  }
};

const payTypeLabel = (raw: string) => {
  const m: Record<string, string> = {
    qr: 'QR',
    webApp: 'MoMo app',
    momo_wallet: 'Ví MoMo',
  };
  return m[raw] ?? raw;
};

export const MoMoPaymentReturn = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const query = useMemo(() => {
    const fromRouter = location.search;
    if (fromRouter) return new URLSearchParams(fromRouter);
    if (typeof window !== 'undefined' && window.location.search) {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  }, [location.search]);

  const {
    orderId,
    requestId,
    resultCodeRaw,
    message,
    transId,
    amount,
    partnerCode,
    orderInfo,
    orderType,
    payType,
    responseTime,
    extraData,
    signature,
  } = useMemo(() => {
    return {
      orderId: getParam(query, 'orderId'),
      requestId: getParam(query, 'requestId'),
      resultCodeRaw: getParam(query, 'resultCode'),
      message: getParam(query, 'message'),
      transId: getParam(query, 'transId'),
      amount: getParam(query, 'amount'),
      partnerCode: getParam(query, 'partnerCode'),
      orderInfo: getParam(query, 'orderInfo'),
      orderType: getParam(query, 'orderType'),
      payType: getParam(query, 'payType'),
      responseTime: getParam(query, 'responseTime'),
      extraData: getParam(query, 'extraData'),
      signature: getParam(query, 'signature'),
    };
  }, [query]);

  const fullReturnUrl = useMemo(
    () =>
      typeof window !== 'undefined'
        ? `${window.location.origin}${location.pathname}${location.search}`
        : `${location.pathname}${location.search}`,
    [location.pathname, location.search],
  );

  const resultCode = parseResultCode(resultCodeRaw);
  const hasParams = Boolean(
    orderId || resultCodeRaw || requestId || partnerCode || signature,
  );
  const success = resultCode !== null && isMoMoSuccess(resultCode);
  const failed = resultCode !== null && !isMoMoSuccess(resultCode);
  const unknown = !hasParams || resultCode === null;

  const callbackMutation = useMutation({
    mutationFn: async () => {
      const parsedAmount = Number.parseInt(amount, 10);
      const parsedResultCode = parseResultCode(resultCodeRaw);
      const parsedTransId = transId ? Number.parseInt(transId, 10) : undefined;
      const parsedResponseTime = responseTime
        ? Number.parseInt(responseTime, 10)
        : undefined;

      if (
        !orderId ||
        !requestId ||
        !partnerCode ||
        !signature ||
        !Number.isFinite(parsedAmount) ||
        parsedAmount <= 0 ||
        parsedResultCode === null
      ) {
        throw new Error('Missing required MoMo callback fields.');
      }

      const res = await billingService.applyMoMoTopUpCallback({
        partnerCode,
        orderId,
        requestId,
        amount: parsedAmount,
        resultCode: parsedResultCode,
        transId: Number.isFinite(parsedTransId) ? parsedTransId : undefined,
        message: message || undefined,
        orderInfo: orderInfo || undefined,
        orderType: orderType || undefined,
        payType: payType || undefined,
        extraData: extraData || undefined,
        responseTime: Number.isFinite(parsedResponseTime)
          ? parsedResponseTime
          : undefined,
        signature,
      });

      if (!res.data.isSuccess) {
        throw new Error(res.data.message || 'Failed to confirm MoMo callback.');
      }
      return res.data;
    },
  });

  useEffect(() => {
    if (success && callbackMutation.isIdle) {
      callbackMutation.mutate();
    }
  }, [success, callbackMutation]);

  useEffect(() => {
    if (success && callbackMutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: walletQueryKey });
    }
  }, [success, callbackMutation.isSuccess, queryClient]);

  const tokensPath = BRAND_ROUTE_MAP.tokens;

  const goTokens = () =>
    isAuthenticated
      ? navigate(tokensPath, { replace: true })
      : navigate(`/login?redirect=${encodeURIComponent(tokensPath)}`, {
          replace: true,
        });

  const technicalPanel = hasParams ? (
    <div className='space-y-4'>
      {location.search ? (
        <div>
          <Typography.Text
            type='secondary'
            className='mb-2 block text-xs tracking-wide uppercase'
          >
            Full return URL (support)
          </Typography.Text>
          <Typography.Paragraph
            copyable={{ text: fullReturnUrl }}
            className='mb-0 rounded-lg bg-slate-50 px-3 py-2 font-mono text-[11px] leading-relaxed break-all text-slate-600'
          >
            {fullReturnUrl}
          </Typography.Paragraph>
        </div>
      ) : null}
      <Descriptions
        bordered
        size='small'
        column={1}
        styles={{ label: { fontWeight: 600, width: 148 } }}
        className='[&_.ant-descriptions-view]:rounded-lg [&_.ant-descriptions-view]:border-slate-200'
      >
        {orderId ? (
          <Descriptions.Item label='Order ID'>
            <Typography.Text copyable>{orderId}</Typography.Text>
          </Descriptions.Item>
        ) : null}
        {requestId ? (
          <Descriptions.Item label='Request ID'>
            <Typography.Text copyable>{requestId}</Typography.Text>
          </Descriptions.Item>
        ) : null}
        {resultCodeRaw ? (
          <Descriptions.Item label='Result code'>
            {resultCodeRaw}
          </Descriptions.Item>
        ) : null}
        {transId ? (
          <Descriptions.Item label='Transaction ID'>
            <Typography.Text copyable>{transId}</Typography.Text>
          </Descriptions.Item>
        ) : null}
        {amount ? (
          <Descriptions.Item label='Amount (raw)'>{amount}</Descriptions.Item>
        ) : null}
        {partnerCode ? (
          <Descriptions.Item label='Partner code'>
            {partnerCode}
          </Descriptions.Item>
        ) : null}
        {orderInfo ? (
          <Descriptions.Item label='Order info'>{orderInfo}</Descriptions.Item>
        ) : null}
        {orderType ? (
          <Descriptions.Item label='Order type'>{orderType}</Descriptions.Item>
        ) : null}
        {payType ? (
          <Descriptions.Item label='Pay type'>{payType}</Descriptions.Item>
        ) : null}
        {message ? (
          <Descriptions.Item label='Message'>{message}</Descriptions.Item>
        ) : null}
        {responseTime ? (
          <Descriptions.Item label='Response time'>
            {formatResponseTime(responseTime)}
          </Descriptions.Item>
        ) : null}
        {extraData !== '' && extraData ? (
          <Descriptions.Item label='Extra data'>{extraData}</Descriptions.Item>
        ) : null}
        {signature ? (
          <Descriptions.Item label='Signature'>
            <Typography.Text
              code
              className='text-[11px] break-all'
            >
              {signature.length > 56 ? `${signature.slice(0, 56)}…` : signature}
            </Typography.Text>
          </Descriptions.Item>
        ) : null}
      </Descriptions>
    </div>
  ) : null;

  return (
    <div>
      <PageHeader
        title='Payment result'
        breadcrumbs={[
          { title: 'Brand' },
          { title: 'Tokens & top-up' },
          { title: 'MoMo' },
        ]}
        seo={{
          description: 'MoMo payment return — token top-up status.',
          keywords: 'MoMo, payment, tokens',
        }}
      />

      <Card
        classNames={{ body: '!p-0' }}
        className='overflow-hidden rounded-2xl border-0 shadow-xl ring-1 shadow-slate-200/60 ring-slate-200/60'
      >
        <div
          className={
            success
              ? 'h-1.5 bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-500'
              : failed
                ? 'h-1.5 bg-linear-to-r from-rose-400 to-red-500'
                : 'h-1.5 bg-linear-to-r from-amber-300 to-amber-500'
          }
        />

        <div className='px-6 py-8 sm:px-10 sm:py-10'>
          <div className='mb-8 flex items-center justify-between gap-3'>
            <Space
              align='center'
              size={10}
            >
              <span className='inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#A50064]/10 text-[#A50064]'>
                <SafetyCertificateOutlined className='text-lg' />
              </span>
              <div>
                <Typography.Text className='block text-xs font-medium tracking-wider text-slate-500 uppercase'>
                  MoMo
                </Typography.Text>
                <Typography.Text
                  strong
                  className='text-slate-800'
                >
                  Token top-up
                </Typography.Text>
              </div>
            </Space>
            {success ? (
              <Tag
                color='success'
                className='m-0 border-0 px-3 py-0.5 text-xs font-medium'
              >
                Paid
              </Tag>
            ) : failed ? (
              <Tag
                color='error'
                className='m-0 border-0 px-3 py-0.5 text-xs font-medium'
              >
                Not completed
              </Tag>
            ) : (
              <Tag
                color='warning'
                className='m-0 border-0 px-3 py-0.5 text-xs font-medium'
              >
                Pending info
              </Tag>
            )}
          </div>

          {unknown && (
            <div className='text-center'>
              <div className='mx-auto mb-5 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-amber-50 text-amber-500 ring-8 ring-amber-50/80'>
                <InfoCircleOutlined className='text-4xl' />
              </div>
              <Typography.Title
                level={3}
                className='!mt-0 !mb-2 !text-xl !font-semibold text-slate-900'
              >
                Could not read payment result
              </Typography.Title>
              <Typography.Paragraph
                type='secondary'
                className='mx-auto mb-6 max-w-sm text-[15px] leading-relaxed'
              >
                MoMo did not return the expected parameters, or you opened this
                page directly. Your balance may still update from our server —
                check Tokens & top-up after signing in.
                {!location.search ? (
                  <>
                    {' '}
                    If you saw a connection error first, make sure your
                    RedirectUrl uses the same{' '}
                    <Typography.Text code>http</Typography.Text> or{' '}
                    <Typography.Text code>https</Typography.Text> scheme as this
                    site.
                  </>
                ) : null}
              </Typography.Paragraph>
              <Button
                type='primary'
                size='large'
                className='min-w-[200px] rounded-lg font-medium shadow-sm'
                onClick={goTokens}
              >
                {isAuthenticated
                  ? 'Back to Tokens & top-up'
                  : 'Sign in to continue'}
              </Button>
            </div>
          )}

          {success && (
            <div className='text-center'>
              <div className='mx-auto mb-5 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-emerald-50 text-emerald-500 ring-8 ring-emerald-100/80'>
                <CheckCircleFilled className='text-4xl' />
              </div>
              <Typography.Title
                level={3}
                className='!mt-0 !mb-1 !text-2xl !font-semibold tracking-tight text-slate-900'
              >
                Payment successful
              </Typography.Title>
              {orderInfo ? (
                <Typography.Paragraph
                  className='!mt-0 !mb-4 text-[15px] text-slate-600'
                  type='secondary'
                >
                  {orderInfo}
                </Typography.Paragraph>
              ) : (
                <Typography.Paragraph
                  type='secondary'
                  className='!mt-0 !mb-4'
                >
                  Thank you — your top-up is being confirmed.
                </Typography.Paragraph>
              )}
              {amount ? (
                <div className='mb-6 rounded-xl bg-slate-50 px-5 py-4 ring-1 ring-slate-100'>
                  <Typography.Text
                    type='secondary'
                    className='mb-1 block text-xs font-medium tracking-wide uppercase'
                  >
                    Amount paid
                  </Typography.Text>
                  <span className='text-3xl font-semibold tracking-tight text-slate-900 tabular-nums'>
                    {formatVnd(amount)}
                  </span>
                  {payType ? (
                    <div className='mt-2'>
                      <Tag className='m-0 border-slate-200 bg-white text-slate-600'>
                        {payTypeLabel(payType)}
                      </Tag>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <Alert
                type={callbackMutation.isError ? 'warning' : 'info'}
                showIcon
                className='mb-6 rounded-xl border-0 bg-blue-50/90 text-left text-slate-700'
                message='Wallet balance'
                description={
                  callbackMutation.isError
                    ? `MoMo redirect succeeded, but callback confirmation failed: ${(callbackMutation.error as Error).message}. Please contact support with Order ID / Request ID below.`
                    : 'Your brand wallet updates when our server receives confirmation from MoMo (usually within seconds). Refresh the wallet card if the balance looks unchanged.'
                }
              />
              <Space
                size='middle'
                wrap
                className='justify-center'
              >
                <Button
                  type='primary'
                  size='large'
                  className='min-w-[200px] rounded-lg px-8 font-medium shadow-sm'
                  onClick={goTokens}
                >
                  {isAuthenticated ? 'View wallet' : 'Sign in to view wallet'}
                </Button>
              </Space>
            </div>
          )}

          {failed && (
            <div className='text-center'>
              <div className='mx-auto mb-5 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-rose-50 text-rose-500 ring-8 ring-rose-50/80'>
                <CloseCircleFilled className='text-4xl' />
              </div>
              <Typography.Title
                level={3}
                className='!mt-0 !mb-2 !text-xl !font-semibold text-slate-900'
              >
                Payment not completed
              </Typography.Title>
              <Typography.Paragraph
                type='secondary'
                className='mx-auto mb-2 max-w-md text-[15px]'
              >
                {message ? (
                  <span className='font-medium text-rose-600'>{message}</span>
                ) : (
                  <>
                    No charge was applied for a successful top-up. You can try
                    again from Tokens & top-up.
                  </>
                )}
              </Typography.Paragraph>
              {resultCodeRaw ? (
                <Typography.Text
                  type='secondary'
                  className='mb-6 block text-sm'
                >
                  Code: <Typography.Text code>{resultCodeRaw}</Typography.Text>
                </Typography.Text>
              ) : (
                <div className='mb-6' />
              )}
              <Button
                type='primary'
                size='large'
                danger
                className='min-w-[200px] rounded-lg font-medium shadow-sm'
                onClick={goTokens}
              >
                {isAuthenticated ? 'Back to Tokens & top-up' : 'Sign in'}
              </Button>
            </div>
          )}

          {hasParams && technicalPanel ? (
            <>
              <Divider className='!my-8 border-slate-100' />
              <Collapse
                bordered={false}
                className='bg-transparent [&_.ant-collapse-content-box]:!pt-1'
                items={[
                  {
                    key: 'details',
                    label: (
                      <span className='text-sm font-medium text-slate-600'>
                        Transaction details
                      </span>
                    ),
                    children: technicalPanel,
                  },
                ]}
              />
            </>
          ) : null}
        </div>
      </Card>
    </div>
  );
};
