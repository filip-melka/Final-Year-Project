FROM public.ecr.aws/lambda/python:3.12

COPY requirements.txt ${LAMBDA_TASK_ROOT}/

RUN pip install --upgrade pip \
 && pip install --no-cache-dir -r ${LAMBDA_TASK_ROOT}/requirements.txt

COPY translate_worker_lambda.py ${LAMBDA_TASK_ROOT}/

CMD ["translate_worker_lambda.lambda_handler"]