import { SpanStatusCode, trace, type Span, type SpanAttributes } from '@opentelemetry/api';

type WithSpanOptions = {
  attributes?: SpanAttributes;
};

const tracer = trace.getTracer('marfanet-app');

export async function withSpan<T>(name: string, options: WithSpanOptions, fn: (span: Span) => Promise<T>): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    if (options?.attributes) {
      span.setAttributes(options.attributes);
    }

    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      span.end();
    }
  });
}

export function getTracer() {
  return tracer;
}
