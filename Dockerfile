FROM jzohrab/lute3:latest

RUN pip install uv;

ENTRYPOINT ["bash"]