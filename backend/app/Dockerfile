FROM public.ecr.aws/lambda/python:3.12

COPY requirements.txt ${LAMBDA_TASK_ROOT}/

RUN pip install --upgrade pip \
 && pip install --no-cache-dir -r ${LAMBDA_TASK_ROOT}/requirements.txt

COPY translate_lambda.py translate_helper_functions.py ${LAMBDA_TASK_ROOT}/

CMD ["translate_lambda.lambda_handler"]
